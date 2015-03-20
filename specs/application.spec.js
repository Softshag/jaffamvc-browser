
describe('application', function () {
  var app;

  beforeEach(function () {
    app = new JaffaMVC.Application();
  });

  it('should be an instanceof Module', function () {
    expect(app).toEqual(jasmine.any(JaffaMVC.Module));
  });

  it('should be an instanceof Application', function () {
    expect(app).toEqual(jasmine.any(JaffaMVC.Application));
  });

  it('should throw error when trying to start history and the app isn\'t running', function() {
    expect(app.startHistory.bind(app)).toThrow(new Error('app not started'));
  });

  it('should start history', function (done) {

    app.start().then(function () {
      var beforeStart = jasmine.createSpy('before:start');
      var start = jasmine.createSpy('start');

      app.on('before:history:start', beforeStart);
      app.on('history:start', start);

      app.startHistory();

      expect(beforeStart).toHaveBeenCalled();
      expect(start).toHaveBeenCalled();

      done();
    });
  });

  it('should stop history', function (done) {

    app.start().then(function () {
      var beforeStop = jasmine.createSpy('before:stop');
      var start = jasmine.createSpy('stop');

      app.on('before:history:stop', beforeStop);
      app.on('history:stop', start);

      app.stopHistory();

      expect(beforeStop).toHaveBeenCalled();
      expect(start).toHaveBeenCalled();

      done();
    });
  });

})
