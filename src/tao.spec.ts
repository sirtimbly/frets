import test from "ava";
import { TAO, Context, Domain, Term, Action, Orientation  } from "frets";
import { taople } from './tao';

class DomainTerms extends Domain<DomainActions, DomainOrientations> {
  @Term
  public get User(): DomainActions { return };
  @Term
  public get Session(): DomainActions { return };
  @Term
  public get Error(): DomainActions { return };
}

class DomainActions extends DomainTerms {
  @Action
  public get Login(): DomainOrientations { return };
  @Action
  public get Add(): DomainOrientations { return };
  @Action
  public get Remove(): DomainOrientations { return };
}

class DomainOrientations extends DomainActions {
  @Orientation
  public get Client(): taople { return }

}

test("tao initializes with type", (t) => {
  const state: any = { handlerCount: 0, log: "" };
  const appTao = new TAO();

  const appDomain = new DomainTerms({}, new DomainActions(), new DomainOrientations());

  appTao.addHandler(appDomain.User.Login.Client, (taople, data) => {
    if (data[taople.t].username === "test" && data[taople.t].password === "tester") {
      appTao.propose({t: "Session", a: "Add", o: "Client"}, { "Session": { id: "1", username: data[taople.t].username }});
    } else {
      return new Context({t: "Error", a: "Add", o: "Client"}, { Error: "Unauthorized"});
    }
    return false;
  });

  appTao.addHandler({t: "Session", a: "Add", o: "Client"}, (taople, data) => {
    console.log(">> New Session handler called.");
    state.sessionId = data[taople.t].id;
    state.username = data[taople.t].username;
    appTao.propose({t: "Error", a: "Remove", o: "Client"});
    return false;
  });

  appTao.addHandler({t: "Session", a: "Add", o: "Client"}, (taople, data) => {
    console.log(">> Second New Session handler called.");
    state.log += "Logged in. \n";
    return false;
  });



  appTao.addHandler({t: "Error", a: "Remove", o: "Client"}, (taople, data) => {
    console.log(">> Error clearing handler called.");
    state.errorMessage = "";
    return false;
  });


  appTao.addHandler({t: "Error", a: "Add", o: "Client"}, (taople, data) => {
    console.log(">> Error handler called.")
    state.errorMessage = data[taople.t];
    return false;
  });

  appTao.addHandler(appDomain.anyT.anyA.anyO, (taople, data) => {
    state.handlerCount++;
    return false;
  });

  appTao.propose({ t: "User", a: "Login", o: "Client"}, {User: { username: "test", password: "failure"}});
  t.falsy(state.sessionId);
  t.is(state.errorMessage, "Unauthorized");

  appTao.propose({ t: "User", a: "Login", o: "Client"}, {User: { username: "test", password: "tester"}});
  t.is(state.sessionId, "1");
  t.is(state.errorMessage, "");
  t.not(state.log, "");

  t.is(state.handlerCount, 5);

})
