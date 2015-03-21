var collection = new JaffaMVC.Collection([{
  title: 'title 1'
}, {
  title: 'title 2'
}, {
  title: 'title 3'
}]);

describe('Collection View', function() {
  var region;

  beforeEach(function() {
    if (region) region.destroy();
    body = document.getElementsByTagName('body')[0];
    region = JaffaMVC.Region.buildRegion('body');
  });

  afterEach(function() {
    if (region) region.destroy();
  })

  describe('Rendering', function() {
    it('should render collection', function(done) {

      var view = new JaffaMVC.CollectionView({
        collection: collection
      });


      view.on('render:children', function() {
        expect(view.children.length).toEqual(3);
        setTimeout(function() {
          expect(view.el.children.length).toEqual(3);
          done();
        })

      });

      view.render();

    });

    it('should render childView', function(done) {
      var view = new JaffaMVC.CollectionView({
        collection: collection,
        childView: JaffaMVC.View.extend({
          template: function(data) {
            return data.title;
          }
        })
      });


      view.on('render:children', function() {

        setTimeout(function() {
          for (var i = 0; i < view.el.children.length; i++) {
            var elm = view.el.children[i];
            expect(elm.innerText).toEqual("title " + (i + 1));
          }
          done()
        })

      });

      view.render();
    });

    it('should pass options to childView', function(done) {
      var view = new JaffaMVC.CollectionView({
        collection: collection,
        childViewOptions: {
          template: function(data) {
            return data.title;
          }
        }
      });


      view.on('render:children', function() {

        setTimeout(function() {
          for (var i = 0; i < view.el.children.length; i++) {
            var elm = view.el.children[i];
            expect(elm.innerText).toEqual("title " + (i + 1));
          }
          done()
        })

      });

      view.render();
    });

    it('should trigger show event on childviews', function(done) {
      var beforeSpy = jasmine.createSpy('onBeforeShow');
      var showSpy = jasmine.createSpy('beforeShow');
      var view = new JaffaMVC.CollectionView({
        collection: collection,
        childView: JaffaMVC.View.extend({
          template: function(data) {
            return data.title;
          },
          onShow: showSpy,
          onBeforeShow: beforeSpy
        })

      });


      view.on('render:children', function() {

        setTimeout(function() {
          expect(showSpy.calls.count()).toEqual(view.collection.length, "show");
          expect(beforeSpy.calls.count()).toEqual(view.collection.length, "before:show");
          done()
        }, 200)

      });

      region.show(view);
    });
  });

  describe('events', function() {
    it('should proxy childview events', function(done) {
      var view = new JaffaMVC.CollectionView({
        collection: collection,
        childView: JaffaMVC.View.extend({
          template: function(data) {
            return data.title;
          },
          triggers: {
            'click': 'click'
          }
        })

      });

      view.on('render:children', function() {
        var spy = jasmine.createSpy('trigger');
        view.on('childview:click', spy)

        setTimeout(function() {

          view.children.forEach(function(item) {
            $(item.el).click();

          })

          expect(spy.calls.count()).toEqual(view.collection.length);
          done();

        });

      });
      region.show(view);
    });
  });

});
