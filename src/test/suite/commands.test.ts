import * as assert from 'assert';
import * as commands from '../../commands';
import * as sinon from 'sinon';

import {StripeClient} from '../../stripeClient';

suite('commands', () => {
  let sandbox: sinon.SinonSandbox;
  const stripeClientStub = <StripeClient> {
    isInstalled: true,
    cliPath: '',
    detectInstalled: () => {},
    getEvents: () => {},
    getResourceById: (id: string) => {}
  };

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('buildTriggerEventsList',() => {
    test('displays all original events when no recent events', async() => {
      const stripeClient = <StripeClient>{
        ...stripeClientStub,
      };
      const getEventsStub = createGetEventStub(stripeClient, []);

      const allEvents = ['a', 'b', 'c', 'd', 'e'];
      const events = await commands.buildTriggerEventsList(allEvents, stripeClient);

      assert.strictEqual(getEventsStub.calledOnce, true);
      const labels = events.map((x) => x.label);
      assert.deepStrictEqual(labels, allEvents);
    });

    test('displays recent events on top', async() => {
      const stripeClient = <StripeClient>{
        ...stripeClientStub,
      };

      const getEventsStub = createGetEventStub(stripeClient, ['c']);

      const allEvents = ['a', 'b', 'c', 'd', 'e'];
      const events = await commands.buildTriggerEventsList(allEvents, stripeClient);

      assert.strictEqual(getEventsStub.calledOnce, true);
      const labels = events.map((x) => x.label);
      assert.deepStrictEqual(labels, ['c', 'a', 'b', 'd', 'e']);
      assert.strictEqual(events[0].description, 'recently triggered');
    });

    function createGetEventStub(stripeClient: StripeClient, eventNames: string[]) {
      const eventsData = {
        data: eventNames.map((l) => ({type: l}))
      };
      return sandbox.stub(stripeClient, 'getEvents').returns(Promise.resolve(eventsData));
    }
  });

});
