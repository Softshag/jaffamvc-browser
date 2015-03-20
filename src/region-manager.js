/* global BaseClass, __has */

let proxyties = [
	'addRegions',
	'addRegion',
	'removeRegion',
	'removeRegions',
]

class RegionManager extends BaseClass {
	constructor () {
		this.regions = {};
    super();
	}

	extendObject (obj) {
      utils.proxy(obj, this, proxyties);
      obj.regions = this.regions;
  }

	unproxyObject (obj) {
		proxyties.forEach((m) => {
			if (obj[m]) {
				delete obj[m];
			}
		});
	}

  /**
    * Add one or more regions to the region manager
    * @param {Object} regions
    * @memberof JaffaMVC.RegionManager#
    */
  addRegions (regions) {
    let def, out = {}, keys = Object.keys(regions);
    keys.forEach(function (k) {
      def = regions[k];
      out[k] = this.addRegion(k, def);
    }, this);
    return out;
  }

  /**
   * Add a region to the RegionManager
   * @param {String} name   The name of the regions
   * @param {String|Object|JaffaMVC.Region} def The region to associate with the name and the RegionManager
   * @memberof JaffaMVC.RegionManager#
   */
  addRegion (name, def) {

    let region = JaffaMVC.Region.buildRegion(def);
    this._setRegion(name, region);

    return region;

  }

  /**
   * Remove one or more regions from the manager
   * @param {...name} name A array of region names
   * @memberof JaffaMVC.RegionManager#
   */
  removeRegion () {
    let names = __slice.call(arguments);

    names.forEach(function (name) {
      if (__has.call(this.regions, name)) {
        let region = this.regions[name];
        region.destroy();
        this._unsetRegion(name);

      }
    }, this);

  }
  /**
   * Destroy the regionmanager
   * @memberof JaffaMVC.RegionManager#
   */
  destroy () {
    super.destroy();
    this.removeRegions();
  }

  /**
   * Remove all regions from the manager
   * @memberof JaffaMVC.RegionManager#
   */
  removeRegions () {
    this.removeRegion.apply(this, Object.keys(this.regions));
  }

  /**
   * @private
   */
  _setRegion (name, region) {
    this.regions[name] = region;
  }

  /**
   * @private
   */
  _unsetRegion (name) {
    delete this.regions[name];
  }
}
