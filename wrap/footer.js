
  [Application,Module,BaseClass,View,CollectionView,LayoutView,
   Region,RegionManager,Collection,Model,List].forEach(function (elm) {
    elm.extend = Backbone.extend
   });

  Backbone.ajax = JaffaMVC.ajax = ajax();

  utils.assign(JaffaMVC, {
    Application: Application,
    Module: Module,
    RegionManager: RegionManager,
    Region: Region,
    LayoutView: LayoutView,
    View: View,
    CollectionView: CollectionView,
    Channel: Channel,
    List: List,
    Object: BaseClass,
    utils: utils,
    NativeView: NativeView,
    Collection: Collection,
    Model: Model,
    Events:Backbone.Events,
    History: Backbone.History,
    Router: Backbone.Router
  });

  return JaffaMVC;

}));
