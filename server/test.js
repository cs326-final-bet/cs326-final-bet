import request from 'supertest';
import { app } from './index.js';

function booleanToEmoji(value) {
    let passedStr = '✔️';
    if (value === false) {
        passedStr = '❌';
    }

    return passedStr;
}

const COLOR_RESET = '\x1b[0m';
const COLOR_FG_BLACK = '\x1b[30m';
const COLOR_BG_RED = '\x1b[41m';
const COLOR_BG_GREEN = '\x1b[42m';

function booleanToColor(value) {
    if (value === true) {
        return COLOR_FG_BLACK + COLOR_BG_GREEN;
    } else {
        return COLOR_FG_BLACK + COLOR_BG_RED;
    }
}

function objMap(obj, fn) {
    return Object.keys(obj)
        .map((key) => {
            return fn(key, obj[key]);
        });
}

class Tester {
    constructor(subject, fn) {
        // Definition
        this.subject = subject;
        this.fn = fn;
    }

    async run() {
        // Collect assertions and children
        const runtimeTester = {
            assertions: {},
            children: [],

            test: function(subject, fn) {
                this.children.push(new Tester(subject, fn));
                return this;
            },
            assert: function(subject) {
                if (Object.keys(this.assertions).indexOf(subject) !== -1) {
                    throw `Assertion with subject "${subject}" already exists and cannot be replaced`;
                }
                
                this.assertions[subject] = {
                    subject: subject,
                    result: undefined,
                    
                    actualValue: undefined,
                    expectedValue: undefined,
                    type: 'eq',

                    actual: function(value) {
                        this.actualValue = value;
                        return this;
                    },
                    expected: function(value) {
                        this.expectedValue = value;
                        return this;
                    },
                    ne: function(value) {
                        this.expectedValue = value;
                        this.type = 'ne';
                    },
                    gt: function(value) {
                        this.expectedValue = value;
                        this.type = 'gt';
                    },
                    lt: function(value) {
                        this.expectedValue = value;
                        this.type = 'lt';
                    },
                    gte: function(value) {
                        this.expectedValue = value;
                        this.type = 'gte';
                    },
                    lte: function(value) {
                        this.expectedValue = value;
                        this.type = 'lte';
                    },
                    run: function() {
                        let result = true;
                        let typeSymbol = '';
                        let typeWords = '';
                        
                        switch (this.type) {
                        case 'eq':
                            result = this.actualValue === this.expectedValue;
                            typeSymbol = '===';
                            typeWords = 'equal';
                            break;
                        case 'ne':
                            result = this.actualValue !== this.expectedValue;
                            typeSymbol = '!==';
                            typeWords = 'not equal';
                            break;
                        case 'gt':
                            result = this.actualValue > this.expectedValue;
                            typeSymbol = '>';
                            typeWords = 'greater than';
                            break;
                        case 'lt':
                            result = this.actualValue < this.expectedValue;
                            typeSymbol = '<';
                            typeWords = 'less than';
                            break;
                        case 'gte':
                            result = this.actualValue >= this.expectedValue;
                            typeSymbol = '>=';
                            typeWords = 'greater than or equal to';
                            break;
                        case 'lte':
                            result = this.actualValue <= this.expectedValue;
                            typeSymbol = '<=';
                            typeWords = 'less than or equal to';
                            break;
                        }
                        
                        return {
                            actual: this.actualValue,
                            expected: this.expectedValue,
                            type: this.type,
                            typeSymbol: typeSymbol,
                            typeWords: typeWords,
                            result: result,
                            subject: this.subject,
                        };
                    },
                };

                return this.assertions[subject];
            },
        };
        await this.fn(runtimeTester);

        const assertRes = objMap(runtimeTester.assertions, (key, a) => {
            return a.run();
        });
        const childrenRes = await Promise.all(runtimeTester.children.map(async (c) => {
            return await c.run();
        }));

        return {
            subject: this.subject,
            assertions: assertRes,
            children: childrenRes,
        };
    }

    resultCheck(res) {
        const failedAsserts = res.assertions
            .filter(a => a.result === false).length > 0;
        const failedChildren = res.children
            .map(c => this.resultCheck(c))
            .filter(r => r === false).length > 0;

        return failedAsserts === false && failedChildren === false;
    }

    resultToString(res, depth) {
        const out = [];
        
        let indent = '';
        if (depth !== undefined) {
            for (let i = 0; i < depth; i++) {
                indent += '  ';
            }
        } else {
            depth = 0;
        }

        const passed = this.resultCheck(res);
        const passedStr = booleanToEmoji(passed);

        const colorStr = booleanToColor(passed);

        out.push(`${indent}${colorStr}${passedStr}${COLOR_RESET} ${res.subject}`);
        
        res.assertions.forEach((a) => {
            if (a.result === true) {
                return;
            }

            const resultStr = booleanToEmoji(a.result);
            const colorStr = booleanToColor(a.result);
            
            out.push(`${indent}  ${colorStr}${resultStr}${COLOR_RESET} ${a.subject} (Expected ${a.typeWords}: "${a.expected}", Actual: "${a.actual}")`);
        });

        res.children
            .map((c) => this.resultToString(c, depth + 1))
            .forEach((childOut) => {
                childOut.forEach((l) => out.push(l));
            });
        return out;
    }
}

const T = new Tester('HTTP API', async (T) => {
    T.test('Area API', async (T) => {
        T.test('Get areas', async (T) => {
            // 1/2 x 1/2 mile squared extent
            const resp = await request(app).get(`/areas?extent=-0.05,-0.05,0,0`);

            // Assert
            T.assert('Response 200 OK')
                .actual(resp.statusCode)
                .expected(200);
            
            T.assert('More than one area returned')
                .actual(resp.body.areas.length)
                .gt(0);
            T.assert('More than one track returned')
                .actual(resp.body.tracks.length)
                .gt(0);
        });
    });
});

// Run tests
(async function() { 
    const res = await T.run();
    
    console.log(T.resultToString(res).join('\n'));

    let exitCode = 0;
    if (T.resultCheck(res) === false) {
        console.log('TESTS FAILED');
        exitCode = 1;
    } else {
        console.log('GOOD');
    }

    process.exit(exitCode);
})();
