
import test from "ava";
import { TAO, Context, Domain, Term, Action, Orientation, taople, PropsWithFields, IFretsProps  } from "frets";



class MyDomain extends Domain {


  @Term() public get User() { return this; }
  @Term() public get Session() {return this;}
  @Term() public get Error() { return this;}

  @Action() public get Login() {return this;}
  @Action() public get Add() {return this;  }
  @Action() public get Remove() {return this;  }

  @Orientation() public get Client() { return this;  }
}
enum SimpleScreens {
  Start,
  End,
}
class SimpleProps extends PropsWithFields implements IFretsProps<SimpleScreens>  {
  public handlerCount: number = 0;
  public sessionId: string;
  public username: string;
  public errorMessage: string;
  public log: string = "";
  public messages: string[];
  public screens: SimpleScreens[];
  public activeScreen: SimpleScreens;

}

test("tao initializes with type", (t) => {
  let renderCount = 0;
  const stateListenerFn = (props: any) => {
    renderCount++;
    console.log("State listener was finally called with modified state", props)
  }
  const props: SimpleProps = new SimpleProps()
  const appTao = new TAO(props, stateListenerFn);

  const appDomain = new MyDomain();
  // t.is(appDomain.User.Login.Client.taople(), { a: "Login", o: "Client", t: "User",});
  const userLogin = appDomain.User.Login.Client.taople();
  appTao.addHandler(userLogin, (taople, data, state) => {
    if (data[taople.t].username === "test" && data[taople.t].password === "tester") {
      const addSession = appDomain.Session.Add.Client.taople();
      const dataPayload = {};
      dataPayload[addSession.t] = { id: "1", username: data[taople.t].username };
      appTao.propose(addSession, dataPayload);
    } else {
      return new Context({t: "Error", a: "Add", o: "Client"}, { Error: "Unauthorized"});
    }
    return false;
  });

  appTao.addHandler({t: "Session", a: "Add", o: "Client"}, (taople, data, state) => {
    console.log(">> New Session handler called.");
    state.sessionId = data[taople.t].id;
    state.username = data[taople.t].username;
    appTao.propose({t: "Error", a: "Remove", o: "Client"});
    return false;
  });

  appTao.addHandler({t: "Session", a: "Add", o: "Client"}, (taople, data, state) => {
    console.log(">> Second New Session handler called.");
    state.log += "Logged in. \n";
    return false;
  });



  appTao.addHandler({t: "Error", a: "Remove", o: "Client"}, (taople, data, state) => {
    console.log(">> Error clearing handler called.");
    state.errorMessage = "";
    return false;
  });


  appTao.addHandler({t: "Error", a: "Add", o: "Client"}, (taople, data, state) => {
    console.log(">> Error handler called.")
    state.errorMessage = data[taople.t];
    return false;
  });

  appTao.addHandler(appDomain.anyT.anyA.anyO, (taople, data, state) => {
    state.handlerCount++;
    return false;
  });

  const newState = appTao.getState();
  appTao.propose({ t: "User", a: "Login", o: "Client"}, {User: { username: "test", password: "failure"}});
  t.falsy(newState.sessionId);
  t.is(newState.errorMessage, "Unauthorized");

  appTao.propose({ t: "User", a: "Login", o: "Client"}, {User: { username: "test", password: "tester"}});
  t.is(newState.sessionId, "1");
  t.is(newState.errorMessage, "");
  t.not(newState.log, "");

  t.is(newState.handlerCount, 5);
  t.is(renderCount, 2);

})


