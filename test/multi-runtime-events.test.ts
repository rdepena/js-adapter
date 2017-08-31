import * as assert from 'assert';
import { delayPromise } from './delay-promise';
import { launchAndConnect, cleanOpenRuntimes } from './multi-runtime-utils';

describe('Multi Runtime', () =>  {
    const appConfigTemplate = {
        name: 'adapter-test-app',
        url: 'about:blank',
        uuid: 'adapter-test-app',
        autoShow: true,
        accelerator: {
            devtools: true
        }
    };
    // tslint:disable-next-line no-function-expression
    afterEach(function(done: Function) {
        cleanOpenRuntimes().then(() => done());
    });

    describe('Events', () => {

        describe('Launch then subscribe', () => {
            describe('application', () => {
                it('should raise closed events', function(done: Function) {
                    // tslint:disable-next-line no-invalid-this
                    this.timeout(12000);

                    async function test() {
                        const runtimeA = await launchAndConnect();
                        const runtimeB = await launchAndConnect();
                        await delayPromise(3000);

                        const realApp = await runtimeB.fin.Application.create(appConfigTemplate);
                        await realApp.run();
                        const app = runtimeA.fin.Application.wrap({ uuid: appConfigTemplate.uuid });

                        app.on('closed', (e: any) => {
                            assert.equal(e.type, 'closed', 'Expected event type to match event');
                            done();
                        });

                        await delayPromise(30);
                        await realApp.close();
                    }

                    test();
                });

                it('should raise started events', function(done: Function) {
                    // tslint:disable-next-line no-invalid-this
                    this.timeout(12000);

                    async function test() {
                        const runtimeA = await launchAndConnect();
                        const runtimeB = await launchAndConnect();
                        await delayPromise(3000);

                        const realApp = await runtimeB.fin.Application.create(appConfigTemplate);
                        const app = runtimeA.fin.Application.wrap({ uuid: appConfigTemplate.uuid });

                        app.on('started', (e: any) => {
                            assert.equal(e.type, 'started', 'Expected event type to match event');
                            app.close().then(done);
                        });

                        await delayPromise(30);
                        await realApp.run();
                        await realApp.close();
                    }

                    test();
                });
            });

            describe('Window', () => {

                it('should raise bounds-changed', function(done: Function) {
                    // tslint:disable-next-line no-invalid-this
                    this.timeout(12000);

                    async function test() {
                        const runtimeA = await launchAndConnect();
                        const runtimeB = await launchAndConnect();
                        await delayPromise(3000);
                        const app = runtimeA.fin.Application.wrap({ uuid: appConfigTemplate.uuid });
                        const win = await app.getWindow();
                        const realApp = await runtimeB.fin.Application.create(appConfigTemplate);
                        await realApp.run();

                        win.on('bounds-changed', (e: any) => {
                            assert.equal(e.type, 'bounds-changed', 'Expected event type to match event');
                            win.close().then(done);
                        });

                        await delayPromise(30);
                        const realWindow = await realApp.getWindow();
                        await realWindow.moveTo(1000, 1000);
                    }

                    test();
                });

                it('should raise hidden', function(done: Function) {
                    // tslint:disable-next-line no-invalid-this
                    this.timeout(12000);

                    async function test() {
                        const runtimeA = await launchAndConnect();
                        const runtimeB = await launchAndConnect();
                        await delayPromise(3000);
                        const app = runtimeA.fin.Application.wrap({ uuid: appConfigTemplate.uuid });
                        const win = await app.getWindow();
                        const realApp = await runtimeB.fin.Application.create(appConfigTemplate);
                        await realApp.run();

                        win.on('hidden', (e: any) => {
                            assert.equal(e.type, 'hidden', 'Expected event type to match event');
                            win.close().then(done);
                        });

                        await delayPromise(30);
                        const realWindow = await realApp.getWindow();
                        await realWindow.hide();
                    }

                    test();
                });
            });
        });

        describe('Subscribe then launch', () => {
            describe.skip('Application', () => {

                it('should raise closed events', function(done: Function) {
                    // tslint:disable-next-line no-invalid-this
                    this.timeout(12000);

                    async function test() {
                        const runtimeA = await launchAndConnect();
                        await delayPromise(3000);
                        const app = runtimeA.fin.Application.wrap({ uuid: appConfigTemplate.uuid });

                        app.on('closed', (e: any) => {
                            assert.equal(e.type, 'closed', 'Expected event type to match event');
                            done();
                        });

                        const runtimeB = await launchAndConnect();
                        await delayPromise(3000);
                        const realApp = await runtimeB.fin.Application.create(appConfigTemplate);
                        await realApp.run();
                        await realApp.close();
                    }

                    test();
                });

                it('should raise started events', function(done: Function) {
                    // tslint:disable-next-line no-invalid-this
                    this.timeout(12000);

                    async function test() {
                        const runtimeA = await launchAndConnect();
                        await delayPromise(3000);
                        const app = runtimeA.fin.Application.wrap({ uuid: appConfigTemplate.uuid });

                        app.on('started', (e: any) => {
                            assert.equal(e.type, 'started', 'Expected event type to match event');
                            app.close().then(done);
                        });

                        const runtimeB = await launchAndConnect();
                        const realApp = await runtimeB.fin.Application.create(appConfigTemplate);
                        await realApp.run();
                    }

                    test();
                });
            });
        });

        describe.skip('Window', () => {

            it('should raise bounds-changed', function(done: Function) {
                // tslint:disable-next-line no-invalid-this
                this.timeout(12000);

                async function test() {
                    const runtimeA = await launchAndConnect();
                    await delayPromise(3000);
                    const app = runtimeA.fin.Application.wrap({ uuid: appConfigTemplate.uuid });
                    const win = await app.getWindow();

                    win.on('bounds-changed', (e: any) => {
                        assert.equal(e.type, 'bounds-changed', 'Expected event type to match event');
                        win.close().then(done);
                    });

                    const runtimeB = await launchAndConnect();
                    await delayPromise(3000);
                    const realApp = await runtimeB.fin.Application.create(appConfigTemplate);
                    await realApp.run();
                    const realWindow = await realApp.getWindow();
                    await realWindow.moveTo(100, 100);
                }

                test();
            });

            it('should raise hidden', function(done: Function) {
                // tslint:disable-next-line no-invalid-this
                this.timeout(12000);

                async function test() {
                    const runtimeA = await launchAndConnect();
                    await delayPromise(3000);
                    const app = runtimeA.fin.Application.wrap({ uuid: appConfigTemplate.uuid });
                    const win = await app.getWindow();

                    win.on('hidden', (e: any) => {
                        assert.equal(e.type, 'hidden', 'Expected event type to match event');
                        win.close().then(done);
                    });

                    const runtimeB = await launchAndConnect();
                    await delayPromise(3000);
                    const realApp = await runtimeB.fin.Application.create(appConfigTemplate);
                    await realApp.run();
                    const realWindow = await realApp.getWindow();
                    await realWindow.hide();
                }

                test();
            });
        });
    });

});
