JaffaMVC.Debug = true;
//Backbone.$ = JaffaMVC.$ = $;
var html = '<div style="height:100px;background-color:red;"><button class="button">OK</button><input class="input"></div>';
JaffaMVC.$(function () {

  var app = new JaffaMVC.Application({
    regions: {
      header: "#header",
      content: "#content"
    }
  });

  app.start();

  var view = new JaffaMVC.View({
    template: function (data) {
        return html + data.title
    },
    ui: {
      button: '.button'
    },
    model: new JaffaMVC.Model({
      title: 'Test title'
    }),
    events: {
      'click': function () {
        console.log('click on div')
      },
      "click @ui.button": function () {
        this.ui.button.innerHTML = "TEST"
      },
      "change .input": function () {
        console.log('input change')
      }
    },
    onRender: function () {
      console.log(this)
    }
  });

  app.regions.header.show(view);


  var Collection = JaffaMVC.Collection.extend({
    url: 'test.json'
  });
  var collection = new Collection([{"title":"Title 1"},{"title": "Title 2"}, {"title": "Title 3"}]);





  var collectionView = new JaffaMVC.CollectionView({
    collection: collection,
    childView: JaffaMVC.View.extend({
      triggers: {
        'click': "click"
      },
      template: function (data) {
        return "<p>" + data.title + "</p>"
      },
      onShow: function () {
        console.log('on show', this.model.get('title'))
      }
     })
  });

  collectionView.on('childview:click', function () {
    console.log('child view was selected');
    //collection.fetch();
    //collection.reset([{"title":"Title 1"},{"title": "Title 2"}, {"title": "Title 3"}])
  });


  app.regions.content.show(collectionView);
  /*
  setTimeout(function () {
    app.regions.content.show(collectionView);
  }, 1000)

  setTimeout(function () {
    collection.add({title:"Title 4"})
  }, 1200)*/


});
