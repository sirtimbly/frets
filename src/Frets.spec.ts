import test from "ava";
import { ActionsWithFields, FRETS, IFretsProps, PropsWithFields } from "frets";

enum SimpleScreens {
  Start,
  End,
}

class SimpleProps extends PropsWithFields implements IFretsProps<SimpleScreens>  {
  public messages: string[];
  public screens: SimpleScreens[];
  public activeScreen: SimpleScreens;
}

// tslint:disable-next-line:max-classes-per-file
class SimpleActions extends ActionsWithFields {
  public changeState: (e: Event) => boolean;
}

test("FRETS initializes with simple types", (t) => {
   const F = new FRETS<SimpleProps, SimpleActions>(new SimpleProps(), new SimpleActions());
   t.truthy(F.render);
});
