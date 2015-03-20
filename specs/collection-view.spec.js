var collection = new JaffaMVC.Collection([{
  title: 'title 1'
}, {
  title: 'title 2'
}, {
  title: 'title 3'
}]);

describe('Collection View', function() {

  describe('Rendering', function() {
    it('should render collection', function(done) {

      var view = new JaffaMVC.CollectionView({
        collection: collection
      });


      view.on('render:children', function() {
        expect(view.children.length).toEqual(3);
        console.log(view.children.length)
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
  });

});
