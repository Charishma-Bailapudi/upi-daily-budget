module.exports = {
  sendMessage: jest.fn().mockResolvedValue({ ok: true }),
  setWebhook: jest.fn().mockResolvedValue({ ok: true }),
};
