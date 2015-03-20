JaffaMVC.DEBUG = false;

describe('Module', function() {

  describe('life-circle', function() {
    var module;
    beforeEach(function() {
      module = new JaffaMVC.Module();
    });

    it('initial state', function() {
      expect(module.initializer.isInitialized).toEqual(false);
      expect(module.finalizer.isInitialized).toEqual(false);
      expect(module.isRunning).toEqual(false);
    })

    it('should start', function(done) {
      var prom = module.start();
      expect(prom).toEqual(jasmine.any(Promise))
      prom.then(function() {
        expect(module.initializer.isInitialized).toEqual(true, "initializer");
        expect(module.finalizer.isInitialized).toEqual(false, 'finalizer');
        expect(module.isRunning).toEqual(true, 'isRunning');
        done();
      }, done);

    });

    it('should stop', function(done) {
      module.start()
        .then(function() {
          return module.stop();
        }).then(function() {
          //expect(module.finalizer.isInitialized).toEqual(true);
          expect(module.isRunning).toEqual(false);
          done();
        }, done); //.catch(done);
    });

    /*it('should reset', function () {
      module.start();
      module.stop();
      module.reset();

      expect(module.isStarted()).toEqual(false);
      expect(module.isStopped()).toEqual(false);
    });*/

  });

  describe('initializers', function() {
    var module;
    var handlers;
    beforeEach(function() {
      module = new JaffaMVC.Module();
      handlers = [];
      for (var i = 0; i < 10; i++) {
        var h = jasmine.createSpy('initializer' + i);
        handlers.push(h);
        module.addInitializer(h);
      }
    });


    it('should run a sync initializers', function(done) {

      module.start()
        .then(function() {
          handlers.forEach(function(h) {
            expect(h).toHaveBeenCalled()
            expect(h.calls.count()).toEqual(1);
            done();
          }, done);
        });


    });

    it('should pass argument to every initializer', function(done) {

      var o = 'OPTIONS';

      module.start(o).then(function() {
        handlers.forEach(function(h) {
          expect(h).toHaveBeenCalledWith(o);
          done();
        }, done);
      });



    })

    /*it('should call done callback when done initializing', function(done) {

      var handler = jasmine.createSpy('done');

      module.start(handler)
      .then(function () {
        expect(handler).toHaveBeenCalled();
      expect(handler.calls.count()).toEqual(1);
      done();
      },done);

    });

    it('should call done and pass arguments', function(done) {

      var handler = jasmine.createSpy('done');
      var args = "ARGS";

      module.start(args, handler);

      handlers.forEach(function(h) {
        expect(h.calls.count()).toEqual(1);
        expect(h).toHaveBeenCalledWith(args);
      });

      expect(handler).toHaveBeenCalled();
      expect(handler.calls.count()).toEqual(1);

    });*/

    it('should trigger before:start event', function(done) {

      var handler = jasmine.createSpy('before:start');

      module.on('before:start', handler);

      module.start().then(function() {
        expect(handler).toHaveBeenCalled();
        expect(handler.calls.count()).toEqual(1);
        done();
      }, done);
    });

    it('should trigger start event', function(done) {

      var handler = jasmine.createSpy('start');

      module.on('start', handler);

      module.start().then(function() {
        expect(handler).toHaveBeenCalled();
        expect(handler.calls.count()).toEqual(1);
        done();
      }, done);


    });
  });

  describe('finalizers', function() {

    var module;
    var handlers;

    beforeEach(function(done) {
      module = new JaffaMVC.Module();
      handlers = [];
      for (var i = 0; i < 10; i++) {
        var h = jasmine.createSpy('finalizer' + i);
        handlers.push(h);
        module.addFinalizer(h);
      }
      module.start().then(function() {
        done();
      }, done);
    });

    it('should run a sync finalizer', function(done) {

      module.stop().then(function() {
        handlers.forEach(function(h) {
          expect(h).toHaveBeenCalled()
          expect(h.calls.count()).toEqual(1);
          done();
        });
      }, done);



    });

    it('should pass argument to every finalizer', function(done) {

      var o = 'OPTIONS';

      module.stop(o).then(function() {
        handlers.forEach(function(h) {
          expect(h).toHaveBeenCalledWith(o);
        });
        done();
      }, done);



    })

    /*it('should call done callback when done initializing', function() {

      var handler = jasmine.createSpy('done');

      module.stop(handler);
      expect(handler).toHaveBeenCalled();
      expect(handler.calls.count()).toEqual(1);
    });

    it('should call done and pass arguments', function() {

      var handler = jasmine.createSpy('done');
      var args = "ARGS";

      module.stop(args, handler);

      handlers.forEach(function(h) {
        expect(h.calls.count()).toEqual(1);
        expect(h).toHaveBeenCalledWith(args);
      });

      expect(handler).toHaveBeenCalled();
      expect(handler.calls.count()).toEqual(1);

    });*/

    it('should trigger "before:stop" event', function(done) {

      var handler = jasmine.createSpy('before:stop');

      module.on('before:stop', handler);

      module.stop().then(function () {
        expect(handler).toHaveBeenCalled();
      expect(handler.calls.count()).toEqual(1);
      done();
      }, done);



    });

    it('should trigger "stop" event', function(done) {

      var handler = jasmine.createSpy('stop');

      module.on('stop', handler);

      module.stop().then(function () {
        expect(handler).toHaveBeenCalled();
      expect(handler.calls.count()).toEqual(1);
      done();
      },done);



    });
  });

});
