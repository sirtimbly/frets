import test from 'ava';
import {
    PropsWithFields,
    setup
} from '../src/index';
import {
    h
} from 'maquette';
import {
    createTestProjector
} from 'maquette-query';
var SimpleScreens;
(function (SimpleScreens) {
    SimpleScreens[SimpleScreens["Start"] = 0] = "Start";
    SimpleScreens[SimpleScreens["End"] = 1] = "End";
    SimpleScreens[SimpleScreens["Home"] = 2] = "Home";
    SimpleScreens[SimpleScreens["About"] = 3] = "About";
})(SimpleScreens || (SimpleScreens = {}));
class SimpleProps extends PropsWithFields {
    constructor() {
        super(...arguments);
        this.messages = [];
        this.checkValue = 0;
    }
}
test('FRETS initializes with simple types', t => {
    const app = setup(new SimpleProps(), (f) => {
        t.truthy(f.modelProps);
        t.truthy(f.modelProps.messages);
    });
    t.truthy(app.mountTo);
});
// Test("renders default div", (t) => {
// });
test('actions change state', t => {
    const app = setup(new SimpleProps(), f => {
        f.registerAcceptor((proposal, state) => {
            if (proposal.messages) {
                f.modelProps.messages = proposal.messages;
            }
            state(f.modelProps);
        });
        const changeState = f.registerAction('changeState', (e, present) => {
            present({
                messages: ['test']
            });
        });
        f.registerView((fretsApp) => {
            return h('div', [
                h('button', {
                    onclick: changeState
                }, ['Load Messages']),
                h('ul', fretsApp.modelProps.messages.map(x => h('li', [x.toString()])))
            ]);
        });
    });
    const proj = createTestProjector(app.stateRenderer);
    const list = proj.query('ul');
    t.falsy(list.children.length);
    const button = proj.query('button');
    t.truthy(button.exists);
    button.simulate.click();
    t.truthy(list.children.length);
    t.falsy(list.children[0].children);
    t.is(list.children[0].text, 'test');
});
test('change state but validator stops mutation', t => {
    const mainApp = setup(new SimpleProps(), f => {
        f.registerAcceptor((proposal, state) => {
            if (proposal.checkValue < 0) {
                f.modelProps.messages = ['Invalid'];
            }
            state(f.modelProps);
        });
        const setOne = f.registerAction('setOne', (e, propose) => {
            propose({
                checkValue: 1
            });
        });
        const setNegOne = f.registerAction('setNegOne', (e, propose) => {
            propose({
                checkValue: -1
            });
        });
        f.registerView((app) => {
            return h('div', [
                h('button#valid', {
                    onclick: setOne
                }, ['Set to 1']),
                h('button#invalid', {
                    onclick: setNegOne
                }, ['Set to -1']),
                h('ul', app.modelProps.messages.map(x => h('li', [x.toString()])))
            ]);
        });
    });
    const proj = createTestProjector(mainApp.stateRenderer);
    const list = proj.query('ul');
    t.falsy(list.children.length);
    const button1 = proj.query('button#valid');
    const button2 = proj.query('button#invalid');
    button1.simulate.click();
    t.falsy(list.children.length);
    button2.simulate.click();
    t.is(list.children[0].text, 'Invalid');
});
test('state updates async', t => {
    const mainApp = setup(new SimpleProps(), f => {
        f.registerAcceptor((proposal, state) => {
            state(f.modelProps);
        });
        const timeoutdone = f.registerAction('timeoutdone', (e, present) => {
            setTimeout(() => {
                present({
                    messages: ['async']
                });
            }, 50);
        });
        f.registerView((app) => {
            return h('div', [
                h('button', {
                    onclick: timeoutdone
                }, ['Load Messages']),
                h('ul', app.modelProps.messages.map(x => h('li', [x.toString()])))
            ]);
        });
    });
    const proj = createTestProjector(mainApp.stateRenderer);
    const list = proj.query('ul');
    t.falsy(list.children.length);
    proj.query('button').simulate.click();
    setTimeout(() => {
        const list2 = proj.query('ul');
        t.truthy(list2.children.length);
        t.is(list2.children[0].text, 'async');
    }, 100);
});
test('state updates async model', t => {
    const mainApp = setup(new SimpleProps(), f => {
        f.registerAcceptor((proposal, state) => {
            var _a;
            if ((_a = proposal) === null || _a === void 0 ? void 0 : _a.messages.length) {
                f.modelProps.messages = proposal.messages;
                state(f.modelProps);
            }
            setTimeout(() => {
                f.modelProps.messages = ['done'];
                state(Object.assign({}, f.modelProps));
            }, 50);
        });
        const timeoutdone = f.registerAction('timeoutdone', (e, present) => {
            present({
                messages: ['loading']
            });
        });
        f.registerView((app) => {
            return h('div', [
                h('button', {
                    onclick: timeoutdone
                }, ['Load Messages']),
                h('ul', app.modelProps.messages.map(x => h('li', [x.toString()])))
            ]);
        });
    });
    const proj = createTestProjector(mainApp.stateRenderer);
    const list = proj.query('ul');
    t.falsy(list.children.length);
    proj.query('button').simulate.click();
    t.truthy(list.children.length);
    t.is(list.children[0].text, 'loading');
    setTimeout(() => {
        const list2 = proj.query('ul');
        t.truthy(list2.children.length);
        t.is(list2.children[0].text, 'done');
    }, 100);
});
test('registers a field', t => {
    const mainApp = setup(new SimpleProps(), f => {
        const field = f.registerField('test', '0');
        t.is(f.modelProps.registeredFieldsValues.test, '0');
        t.is(field.value, '0');
    });
});
// Test("registers and updates a field", (t) => {
//   const mainApp = setup<SimpleProps>(new SimpleProps(), (f) => {
//     const field = f.registerField("test", "0");
//     t.is(field.value, "0");
//     f.registerView((app: main): VNode => {
//       return h("div", [
//         h("button", ["Load Messages"]),
//         h("input", {type: "text", onchange: field.handler, value: field.value.toString()}, []),
//         h("div.output", [field.value]),
//       ]);
//     });
//   });
//   const proj = createTestProjector(mainApp.stateRenderer);
//   const input = proj.query("input");
//   t.truthy(input.exists);
//   input.simulate.change({ value: "2"});
//   proj.initialize(mainApp.stateRenderer);
//   t.is(proj.query(".output").textContent, "2");
// });
// test("register view async", (t) => {
//   const F = new FRETS<SimpleProps, SimpleActions>(new SimpleProps(), new SimpleActions());
//   async function asyncViewFunction(app: main): Promise<VNode> {
//     return new Promise<VNode>((resolve, reject) => {
//       // simulate view rendering code being loaded async like from a webpack chunk
//       setTimeout(() => {
//         resolve(h("div", [
//           h("ul", app.modelProps.messages.map((x) => h("li", [x.toString()]))),
//         ]));
//       }, 50);
//     });
//   }
//   F.registerViewAsync(asyncViewFunction);
//   const proj = createTestProjector(F.stateRenderer);
//   const list = proj.query("ul");
//   t.truthy(list.exists);
// });
test('registers a route and changes when navigating', t => {
    const mainApp = setup(new SimpleProps(), f => {
        f.registerAcceptor((proposal, state) => {
            if (proposal.activeScreen) {
                f.modelProps.activeScreen = proposal.activeScreen;
                state(f.modelProps);
            }
        });
        f.registerRouteAction('home', '/home', (context, propose) => {
            propose({
                activeScreen: SimpleScreens.Home
            });
        });
        f.registerRouteAction('about', '/about', (context, propose) => {
            propose({
                activeScreen: SimpleScreens.About
            });
        });
        f.registerView((app) => {
            return h('div', [
                !app.modelProps.activeScreen ||
                app.modelProps.activeScreen === SimpleScreens.Home ?
                h('h1', ['Home Page']) :
                h('h1', ['About Page'])
            ]);
        });
    });
    t.is(mainApp.fretsApp.getRouteLink('about'), '/about');
    t.false(mainApp.fretsApp.getRouteLink('xyz'));
    const proj = createTestProjector(mainApp.stateRenderer);
    t.is(proj.query('h1').textContent, 'Home Page');
    mainApp.fretsApp.navToPath('/about');
    window.dispatchEvent(new Event('popstate'));
    t.is(proj.query('h1').textContent, 'About Page');
    mainApp.fretsApp.navToRoute('home');
    window.dispatchEvent(new Event('popstate'));
    t.is(proj.query('h1').textContent, 'Home Page');
});
// Test("model props can only be updated through an action", (t) => {
//   const F = new FRETS<SimpleProps, SimpleActions>(new SimpleProps(), new SimpleActions());
//   F.registerView((app): VNode => {
//     // try overwriting something in modelProps
//     t.throws(() => app.modelProps.messages.push("try"));
//     return h("div", [
//       (!app.modelProps.activeScreen || app.modelProps.activeScreen === SimpleScreens.Home)
//         ? h("h1", ["Home Page"])
//         : h("h1", ["About Page"]),
//       h("ul", app.modelProps.messages.map((x: string) => h("li", [x]))),
//     ]);
//   });
//   t.not(F.modelProps.messages[0], "try");
//   const proj = createTestProjector(F.stateRenderer);
//   const msgs = proj.query("ul>li");
//   t.falsy(msgs.exists());
//   t.not(F.modelProps.messages[0], "try");
// });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRnJldHMuc3BlYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9GcmV0cy5zcGVjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sSUFBSSxNQUFNLEtBQUssQ0FBQztBQUN2QixPQUFPLEVBRU4sZUFBZSxFQUNmLEtBQUssRUFDTCxNQUFNLE9BQU8sQ0FBQztBQUNmLE9BQU8sRUFBQyxDQUFDLEVBQVEsTUFBTSxVQUFVLENBQUM7QUFDbEMsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFbkQsSUFBSyxhQUtKO0FBTEQsV0FBSyxhQUFhO0lBQ2pCLG1EQUFLLENBQUE7SUFDTCwrQ0FBRyxDQUFBO0lBQ0gsaURBQUksQ0FBQTtJQUNKLG1EQUFLLENBQUE7QUFDTixDQUFDLEVBTEksYUFBYSxLQUFiLGFBQWEsUUFLakI7QUFFRCxNQUFNLFdBQVksU0FBUSxlQUFlO0lBQXpDOztRQUNRLGFBQVEsR0FBYSxFQUFFLENBQUM7UUFHeEIsZUFBVSxHQUFHLENBQUMsQ0FBQztJQUN2QixDQUFDO0NBQUE7QUFJRCxJQUFJLENBQUMscUNBQXFDLEVBQUUsQ0FBQyxDQUFDLEVBQUU7SUFDL0MsTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFjLElBQUksV0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFPLEVBQUUsRUFBRTtRQUM3RCxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUN2QixDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDakMsQ0FBQyxDQUFDLENBQUM7SUFDSCxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUN2QixDQUFDLENBQUMsQ0FBQztBQUVILHVDQUF1QztBQUV2QyxNQUFNO0FBRU4sSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUMsQ0FBQyxFQUFFO0lBQ2hDLE1B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
