
  /*Application.extend = View.extend = CollectionView.extend = LayoutView.extend = Region.extend = RegionManager.extend = Module.extend = BaseClass.extend = Backbone.extend;*/

  Backbone.ajax = ajax();

  Object.assign(JaffaMVC, {
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
    NativeView: NativeView
  });

  return JaffaMVC;

}));
