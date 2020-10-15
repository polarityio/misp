'use strict';

polarity.export = PolarityComponent.extend({
  tags: [],
  selectedTags: [],
  showAddTagModal: false,
  timezone: Ember.computed('Intl', function () {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }),
  _flashError: function (msg) {
    this.get('flashMessages').add({
      message: 'MISP: ' + msg,
      type: 'unv-danger',
      timeout: 3000
    });
  },
  actions: {
    removeTag(attributeId, tag, eventId, attributeIndex, tagIndex) {
      let self = this;
      const tagId = tag.id;
      self.set('block.isLoadingDetails', true);

      const payload = {
        action:
          typeof tag.local === 'boolean' && tag.local === false ? 'REMOVE_TAG_FROM_ATTRIBUTE' : 'REMOVE_TAG_FROM_EVENT',
        tagId: tagId,
        eventId: eventId,
        attributeId: attributeId
      };

      this.sendIntegrationMessage(payload)
        .then(
          function (result) {
            const newTags = [];
            let tags = self.get('block.data.details.' + attributeIndex + '.Tag');
            tags.forEach(function (tag, index) {
              if (index !== tagIndex) {
                newTags.push(tag);
              }
            });

            self.set('block.data.details.' + attributeIndex + '.Tag', newTags);
          },
          function (err) {
            console.error(err);
            self._flashError(err.meta.detail, 'error');
          }
        )
        .finally(() => {
          self.set('block.isLoadingDetails', false);
        });
    },
    addTags(eventId, index) {
      let self = this;

      self.set('block.isLoadingDetails', true);

      const payload = {
        action: 'ADD_TAGS',
        tags: this.get('tag'),
        eventId: eventId
      };

      this.sendIntegrationMessage(payload)
        .then(
          function (result) {
            self.get('block.data.details.' + index + '.Tag').pushObjects(self.get('tag'));
            self.set('block.data.details.' + index + '.showAddTagModal', false);
            self.get('tag').clear();
          },
          function (err) {
            console.error(err);
            self._flashError(err.meta.detail, 'error');
          }
        )
        .finally(() => {
          self.set('block.isLoadingDetails', false);
        });
    },
    openAddTagModal(index) {
      let self = this;

      if (this.get('tags.length') > 0) {
        self.set('block.data.details.' + index + '.showAddTagModal', true);
        return;
      }

      self.set('block.isLoadingDetails', true);
      self.set('loadingTags', true);

      const payload = {
        action: 'GET_TAGS'
      };

      this.sendIntegrationMessage(payload)
        .then(
          function (tags) {
            self.set('tags', tags);
            self.set('block.data.details.' + index + '.showAddTagModal', true);
          },
          function (err) {
            console.error(err);
            self._flashError(err.meta.detail, 'error');
          }
        )
        .finally(() => {
          self.set('block.isLoadingDetails', false);
          self.set('loadingTags', false);
        });
    },
    closeAddTagModal(index) {
      this.set('block.data.details.' + index + '.showAddTagModal', false);
    }
  }
});
