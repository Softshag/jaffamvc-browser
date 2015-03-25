/*global View, RegionManager, Region*/

class LayoutView extends View {
  /**
	 * LayoutView
	 * @param {Object} options options
	 * @constructor LayoutView
	 * @memberof JaffaMVC
	 * @augments JaffaMVC.View
	 */
	constructor (options) {
		this.options = options || {};
		let regions = this.getOption('regions');

		// Set region manager
		this._regionManager = new RegionManager();
		utils.proxy(this, this._regionManager, ['removeRegion', 'removeRegions']);
		/**
		 * Regions
		 * @var regions
		 * @memberof JaffaMVC.LayoutView#
		 */
		this.regions = this._regionManager.regions;

		this.options = options || {};

		this.listenTo(this, 'render', function() {
			this.addRegions(regions);
		});

		super(options);

	}

  addRegion (name, def) {
		if (typeof def === 'string') {
			let elm = this.$(def);
			if (!elm.length)
				throw new Error('element must exists in dom');

			def = new Region({
				el: elm[0]
			});

	  }
		this._regionManager.addRegion(name, def);

	}

	addRegions (regions) {
			for (var k in regions) {
				this.addRegion(k, regions[k]);
			}
	}

  destroy () {
		super.destroy();
		this._regionManager.destroy();
	}



}
