import test from 'ava';
import {
	FunFrets,
	PropsWithFields,
	setup
} from './index';
import {h, VNode} from 'maquette';
import { createTestProjector } from 'maquette-query';


enum SimpleScreens {
	Start,
	End,
	Home,
	About
}

class SimpleProps extends PropsWithFields {
	public messages: string[] = [];
	public screens: SimpleScreens[];
	public activeScreen: SimpleScreens;
	public checkValue = 0;
}

type main = FunFrets<SimpleProps>;

test('FRETS initializes with simple types', t => {
	const app = setup<SimpleProps>(new SimpleProps(), (f: main) => {
		t.truthy(f.modelProps);
		t.truthy(f.modelProps.messages);
	});
	t.truthy(app.mountTo);
});

// Test("renders default div", (t) => {

// });

test('actions change state', t => {
	const app = setup<SimpleProps>(new SimpleProps(), f => {
		f.registerAcceptor((proposal, state) => {
			if (proposal.messages) {
				f.modelProps.messages = proposal.messages;
			}

			state(f.modelProps);
		});
		const changeState = f.registerAction('changeState', (e: Event, present) => {
			present({messages: ['test']});
		});
		f.registerView(
			(fretsApp: main): VNode => {
				return h('div', [
					h('button', {onclick: changeState}, ['Load Messages']),
					h(
						'ul',
						fretsApp.modelProps.messages.map(x => h('li', [x.toString()]))
					)
				]);
			}
		);
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
	const mainApp = setup<SimpleProps>(new SimpleProps(), f => {
		f.registerAcceptor((proposal, state) => {
			if (proposal.checkValue < 0) {
				f.modelProps.messages = ['Invalid'];
			}

			state(f.modelProps);
		});

		const setOne = f.registerAction('setOne', (e: Event, propose) => {
			propose({checkValue: 1});
		});
		const setNegOne = f.registerAction('setNegOne', (e: Event, propose) => {
			propose({checkValue: -1});
		});

		f.registerView(
			(app: main): VNode => {
				return h('div', [
					h('button#valid', {onclick: setOne}, ['Set to 1']),
					h('button#invalid', {onclick: setNegOne}, ['Set to -1']),
					h(
						'ul',
						app.modelProps.messages.map(x => h('li', [x.toString()]))
					)
				]);
			}
		);
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
	const mainApp = setup<SimpleProps>(new SimpleProps(), f => {
		f.registerAcceptor((proposal, state) => {
			state(f.modelProps);
		});
		const timeoutdone = f.registerAction('timeoutdone', (e: Event, present) => {
			setTimeout(() => {
				present({
					messages: ['async']
				});
			}, 50);
		});
		f.registerView(
			(app: main): VNode => {
				return h('div', [
					h('button', {onclick: timeoutdone}, ['Load Messages']),
					h(
						'ul',
						app.modelProps.messages.map(x => h('li', [x.toString()]))
					)
				]);
			}
		);
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
	const mainApp = setup<SimpleProps>(new SimpleProps(), f => {
		f.registerAcceptor((proposal, state) => {
			if (proposal?.messages.length) {
				f.modelProps.messages = proposal.messages;
				state(f.modelProps);
			}

			setTimeout(() => {
				f.modelProps.messages = ['done'];
				state({
					...f.modelProps
				});
			}, 50);
		});
		const timeoutdone = f.registerAction('timeoutdone', (e: Event, present) => {
			present({messages: ['loading']});
		});
		f.registerView(
			(app: main): VNode => {
				return h('div', [
					h('button', {onclick: timeoutdone}, ['Load Messages']),
					h(
						'ul',
						app.modelProps.messages.map(x => h('li', [x.toString()]))
					)
				]);
			}
		);
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
	const mainApp = setup<SimpleProps>(new SimpleProps(), f => {
		const field = f.registerField('test', '0');
		t.is(f.modelProps.registeredFieldsValues.test, '0');
		t.is(field.value, '0');
	});
});

test("registers and updates a field", (t) => {
  const mainApp = setup<SimpleProps>(new SimpleProps(), (f) => {

		f.registerView((app: main): VNode => {
			const field = f.registerField("test", "a");
			t.truthy(field.value);
      return h("div", [
        h("button", ["Load Messages"]),
				h("input", { type: "text", oninput: field.handler, value: field.value.toString()}),
        h("div.output", [field.value]),
      ]);
    });
  });
	const proj = createTestProjector(mainApp.stateRenderer);
  const input = proj.query("input");
	let inputElement: HTMLInputElement; // not really useful in this particular application, but added just for demonstration purposes.
	proj.initialize(mainApp.stateRenderer);
	inputElement = { value: 'a' } as any;
	input.setTargetDomNode(inputElement);
  t.truthy(input.exists);
  t.is(proj.query(".output").textContent, "a");
	proj.query("input").simulate.keyPress("b", "", "ab")
  t.is(proj.query(".output").textContent, "ab");
});

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
	const mainApp = setup<SimpleProps>(new SimpleProps(), f => {
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
		f.registerView(
			(app): VNode => {
				return h('div', [
					!app.modelProps.activeScreen ||
					app.modelProps.activeScreen === SimpleScreens.Home
						? h('h1', ['Home Page'])
						: h('h1', ['About Page'])
				]);
			}
		);
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

class FormProps extends PropsWithFields {
	status: 'submitted' | 'draft' = 'draft';
	actionInProgress?: 'save' | 'submit' | 'load' = 'load';
	id?: string;
}

test("state graph resolves", (t) => {
	const main = setup<FormProps>(new FormProps(), f => {
		f.registerAcceptor((proposal, updateState) => {
			console.log('accepting', proposal)
			updateState(proposal)
		})
		f.registerStateGraph({
			name: 'opening',
			// edges are specified in reverse specificity order because edges are evaluated
			// in order and only the first node in an array of edges is returned
			edges: [
				{
					name: 'submitted',
					guard: (props) => props.status === 'submitted',
					renderer: () => h("span", ["submitted the form"])
				},
				{
					name: 'saved',
					guard: (props) => Boolean(props.id),
					renderer: () => h("span", ["saved form"]),
					edges: [
						{
							name: 'submitting',
							guard: (props) => props.actionInProgress === 'submit',
							renderer: () => h("span", ["submitting"])
						}
					]
				},
				{
					name: 'empty',
					guard: (props) => !props.id && props.actionInProgress !== 'load',
					renderer: () => h("span", ["empty form screen"]),
					edges: [
						{
							name: 'saving',
							guard: (props) => (props.actionInProgress === 'save'),
							renderer: () => h("span", ["saving"])
						}
					]
				},
			],
			renderer: () => h("span", ["opening screen"])
		})
		t.truthy(f.currentStateNode)
		const save = f.registerAction('save', (e, present) => {
			console.log('finished loading action')
			present({ actionInProgress: 'save' })
		})

		f.registerView((app) => h('div', [
			h('button#save', { onclick: save }, ['save']),
			app.currentStateNode.renderer(app)
		]))


	})

	t.is(main.fretsApp.modelProps.actionInProgress, 'load')
	const proj = createTestProjector(main.stateRenderer);
	t.is(proj.query('span').textContent, 'opening screen');
	// t.is(main.fretsApp.resolveState().name, 'opening')
	main.present({ actionInProgress: undefined })
	t.is(proj.query('span').textContent, 'empty form screen');
	proj.query('button#save').simulate.click()
	t.is(proj.query('span').textContent, 'saving');
	main.present({ actionInProgress: undefined, id: '12321' })
	t.is(proj.query('span').textContent, 'saved form');
	main.present({ actionInProgress: 'submit' })
	t.is(proj.query('span').textContent, 'submitting');
	main.present({ actionInProgress: undefined, status: 'submitted' })
	t.is(proj.query('span').textContent, 'submitted the form');

})
