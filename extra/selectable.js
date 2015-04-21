const SingleSelect = (function () {

  function SingleSelect(collection) {
    this.collection = collection;
  }

  utils.assign(SingleSelect.prototype, {

    // Select a model, deselecting any previously
    // selected model
    select: function (model) {
      if (model && this.selected === model) {
        return;
      }

      this.deselect();

      this.selected = model;
      this.selected.select();
      this.trigger("select:one", model);
    },

    // Deselect a model, resulting in no model
    // being selected
    deselect: function (model) {
      if (!this.selected) {
        return;
      }

      model = model || this.selected;
      if (this.selected !== model) {
        return;
      }

      this.selected.deselect();
      this.trigger("deselect:one", this.selected);
      delete this.selected;
    }

  });


  return SingleSelect;

})();

const MultiSelect = (function () {
  function MultiSelect(collection) {
    this.collection = collection;
    this.selected = {};
  }

  utils.assign(MultiSelect.prototype, {

    // Select a specified model, make sure the
    // model knows it's selected, and hold on to
    // the selected model.
    select: function (model) {
      if (this.selected[model.cid]) {
        return;
      }

      this.selected[model.cid] = model;
      model.select();
      calculateSelectedLength(this);
    },

    // Deselect a specified model, make sure the
    // model knows it has been deselected, and remove
    // the model from the selected list.
    deselect: function (model) {
      if (!this.selected[model.cid]) {
        return;
      }

      delete this.selected[model.cid];
      model.deselect();
      calculateSelectedLength(this);
    },

    // Select all models in this collection
    selectAll: function () {
      this.each(function (model) {
        model.select();
      });
      calculateSelectedLength(this);
    },

    // Deselect all models in this collection
    selectNone: function () {
      if (this.selectedLength === 0) {
        return;
      }
      this.each(function (model) {
        model.deselect();
      });
      calculateSelectedLength(this);
    },

    // Toggle select all / none. If some are selected, it
    // will select all. If all are selected, it will select
    // none. If none are selected, it will select all.
    toggleSelectAll: function () {
      if (this.selectedLength === this.length) {
        this.selectNone();
      } else {
        this.selectAll();
      }
    }
  });

  // Helper Methods
  // --------------

  // Calculate the number of selected items in a collection
  // and update the collection with that length. Trigger events
  // from the collection based on the number of selected items.
  var calculateSelectedLength = function (collection) {
    collection.selectedLength = Object.keys(collection.selected).length;

    var selectedLength = collection.selectedLength;
    var length = collection.length;

    if (selectedLength === length) {
      collection.trigger("select:all", collection);
      return;
    }

    if (selectedLength === 0) {
      collection.trigger("select:none", collection);
      return;
    }

    if (selectedLength > 0 && selectedLength < length) {
      collection.trigger("select:some", collection);
      return;
    }
  };


  return MultiSelect;
})();

const Selectable = (function () {

  function Selectable(model) {
    this.model = model;
  }

  utils.assign(Selectable.prototype, {

    // Select this model, and tell our
    // collection that we're selected
    select: function () {
      if (this.selected) {
        return;
      }

      this.selected = true;
      this.trigger("selected", this);

      if (this.collection) {
        this.collection.select(this);
      }
    },

    // Deselect this model, and tell our
    // collection that we're deselected
    deselect: function () {
      if (!this.selected) {
        return;
      }

      this.selected = false;
      this.trigger("deselected", this);

      if (this.collection) {
        this.collection.deselect(this);
      }
    },

    // Change selected to the opposite of what
    // it currently is
    toggleSelected: function () {
      if (this.selected) {
        this.deselect();
      } else {
        this.select();
      }
    }
  });

  return Selectable;

})();