import { Channel } from '@libs/backend-config';
import { NotificationChannelFactory } from './notification-channel.factory';

describe('NotificationChannelFactory', () => {
  it('should resolve explicit active channel', () => {
    const inApp = { channel: Channel.IN_APP, send: jest.fn() } as any;
    const push = { channel: Channel.PUSH, send: jest.fn() } as any;
    const whatsapp = { channel: Channel.WHATSAPP, send: jest.fn() } as any;
    const email = { channel: Channel.EMAIL, send: jest.fn() } as any;
    const sms = { channel: Channel.SMS, send: jest.fn() } as any;

    const factory = new NotificationChannelFactory(
      { resolveChannel: jest.fn().mockReturnValue(Channel.PUSH) } as any,
      { warn: jest.fn() } as any,
      inApp,
      push,
      whatsapp,
      email,
      sms,
    );

    expect(factory.get(Channel.PUSH)).toBe(push);
  });

  it('should fallback to in-app when requested channel is inactive', () => {
    const logger = { warn: jest.fn() } as any;
    const inApp = { channel: Channel.IN_APP, send: jest.fn() } as any;
    const push = { channel: Channel.PUSH, send: jest.fn() } as any;
    const whatsapp = { channel: Channel.WHATSAPP, send: jest.fn() } as any;
    const email = { channel: Channel.EMAIL, send: jest.fn() } as any;
    const sms = { channel: Channel.SMS, send: jest.fn() } as any;

    const factory = new NotificationChannelFactory(
      { resolveChannel: jest.fn().mockReturnValue(Channel.IN_APP) } as any,
      logger,
      inApp,
      push,
      whatsapp,
      email,
      sms,
    );

    expect(factory.get(Channel.WHATSAPP)).toBe(inApp);
    expect(logger.warn).toHaveBeenCalled();
  });
});
