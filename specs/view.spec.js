describe('View', function() {

  it('should have a static "extend" function', function() {
    expect(JaffaMVC.View.extend).toEqual(jasmine.any(Function))
  })

  it('should be instanceof nativeview', function() {
    var view = new JaffaMVC.View();
    expect(view).toEqual(jasmine.any(JaffaMVC.NativeView));
  });

  it('should set el and $el property', function() {
    var view = new JaffaMVC.View();
    expect(view.el).not.toBe(null);
    expect(view.el).not.toBe(null);
    expect(view.$el).not.toBe(null);
  });

  it('should destroy');

  describe('rendering', function() {


    it('should render without template', function() {
      var view = new JaffaMVC.View();
      view.render();
      expect(view._isRendered).toBe(true);
      expect(view.el.innerHTML).toEqual('');

    });

    it('should emit before:render event', function() {
      var view = new (JaffaMVC.View.extend({
        onBeforeRender: jasmine.createSpy('onBeforeRender')
      }));

      var spy = jasmine.createSpy('before:render');
      view.on('before:render', spy);
      view.render();

      expect(spy.calls.count()).toEqual(1);
      expect(view.onBeforeRender.calls.count()).toEqual(1);
    });

    it('should emit render event', function(done) {
      var view = new (JaffaMVC.View.extend({
        onRender: jasmine.createSpy('onRender')
      }));
      var spy = jasmine.createSpy('render');
      view.on('render', spy);
      view.on('render', function() {
        expect(spy.calls.count()).toEqual(1);
        setTimeout(function () {
          expect(view.onRender.calls.count()).toEqual(1);
          done();
        })

      });

      view.render();
    });

    it('should render template string', function(done) {
      var view = new JaffaMVC.View({
        template: 'Hello, World!'
      });

      view.render();
      view.on('render', function() {
        expect(view.el.innerHTML).toBe('Hello, World!');
        done();
      });
    });

    it('should render template function', function(done) {
      var view = new JaffaMVC.View({
        template: function(data) {
          return "Hello, World!";
        }
      });

      view.render();

      view.on('render', function() {
        expect(view.el.innerHTML).toBe('Hello, World!');
        done();
      });
    });

    it('should render template function with model data', function(done) {
      var view = new JaffaMVC.View({
        template: function(data) {
          return "Hello, " + data.who + '!';
        },
        model: new JaffaMVC.Model({
          who: 'You'
        })
      });

      view.render();

      view.on('render', function() {
        expect(view.el.innerHTML).toBe('Hello, You!');
        done();
      });

    });

    it('should render template function which returns a promise', function (done) {
      var view = new JaffaMVC.View({
        template: function(data) {
          return new Promise(function (resolve, reject) {
            return resolve('Hello, World!');
          });
        }
      });

      view.render();

      view.on('render', function() {
        expect(view.el.innerHTML).toBe('Hello, World!');
        done();
      });
    });

    it('should render template function with node style callback', function (done) {
      var view = new JaffaMVC.View({
        template: function(data, done) {
          done(null, 'Hello, World!');
        }
      });

      view.render();

      view.on('render', function() {
        expect(view.el.innerHTML).toBe('Hello, World!');
        done();
      });
    });

    xit('should render template function with generator', function (done) {
      var view = new JaffaMVC.View({
        template: function (data) {
          return 'Hello, World!';
        }
      });

      view.render();

      view.on('render', function() {
        expect(view.el.innerHTML).toBe('Hello, World!');
        done();
      });
    });

  });

  describe('Properties', function() {
    it('parse ui properties', function(done) {
      var view = new JaffaMVC.View({
        ui: {
          button: '.button'
        },
        template: '<button class="button">Ok</button>'
      });

      view.render();

      view.on('render', function () {

        expect(view.ui).toEqual(jasmine.any(Object));
        expect(view.ui.button).not.toBe(null);

        expect(view.ui.button).toEqual(view.$('.button')[0]);

        done();
      });
    });

    it('sould use @ui in events', function(done) {

      var spy = jasmine.createSpy('onclick')

      var view = new (JaffaMVC.View.extend({
        ui: {
          button: '.button'
        },
        template: '<button class="button">Ok</button>',
        events: {
          'click @ui.button': spy
        }
      }));



      view.on('render', function () {
        $(view.ui.button).click();
        expect(spy.calls.count()).toEqual(1);
        view.destroy();

        done();
      });

      var body = document.getElementsByTagName('body')[0];
      body.appendChild(view.render().el)

    });
  });

  describe('Triggers', function() {

    it('should trigger events', function(done) {
      var view = new (JaffaMVC.View.extend({
        template: '<button class="button">OK</button>',
        triggers: {
          'click .button': 'click'
        },
        ui: {
          button: '.button'
        }
      }));

      var spy = jasmine.createSpy('click');

      view.on('render', function () {

        view.on('click', spy);

        $(view.ui.button).click();

        expect(spy.calls.count()).toEqual(1);
        view.destroy();
        done();

      });
      var body = document.getElementsByTagName('body')[0];
      body.appendChild(view.render().el)

    });

    it('should use @ui in triggers', function (done) {
      var view = new (JaffaMVC.View.extend({
        template: '<button class="button">OK</button>',
        triggers: {
          'click @ui.button': 'click'
        },
        ui: {
          button: '.button'
        }
      }));

      var spy = jasmine.createSpy('click');

      view.on('render', function () {

        view.on('click', spy);

        $(view.ui.button).click();

        expect(spy.calls.count()).toEqual(1);
        view.destroy();
        done();

      });
      var body = document.getElementsByTagName('body')[0];
      body.appendChild(view.render().el);

    });

  });




});
