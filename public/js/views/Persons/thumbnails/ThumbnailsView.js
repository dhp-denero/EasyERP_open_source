﻿define([
    'Backbone',
    'jQuery',
    'Underscore',
    'common',
    'views/thumbnailsViewBase',
    'views/Persons/EditView',
    'views/Persons/CreateView',
    'text!templates/Alpabet/AphabeticTemplate.html',
    'text!templates/Persons/thumbnails/ThumbnailsItemTemplate.html',
    'dataService',
    'views/Filter/filterView',
    'constants'
], function (Backbone, $, _, common, BaseView, EditView, CreateView, AphabeticTemplate, ThumbnailsItemTemplate, dataService, FilterView, CONSTANTS) {
    'use strict';

    var PersonsThumbnalView = BaseView.extend({
        el             : '#content-holder',
        countPerPage   : 0,
        template       : _.template(ThumbnailsItemTemplate),
        hasAlphabet    : true,
        contentType    : 'Persons', // needs in view.prototype.changeLocationHash
        viewType       : 'thumbnails', // needs in view.prototype.changeLocationHash
        exportToXlsxUrl: '/Customers/exportToXlsx/?type=Persons',
        exportToCsvUrl : '/Customers/exportToCsv/?type=Persons',
        letterKey      : 'name.first',

        initialize: function (options) {
            this.mId = CONSTANTS.MID[this.contentType];
            $(document).off('click');

            this.EditView = EditView;
            this.CreateView = CreateView;

            _.bind(this.collection.showMoreAlphabet, this.collection);
            this.allAlphabeticArray = common.buildAllAphabeticArray();

            this.asyncLoadImgs(this.collection);
            this.stages = [];

            BaseView.prototype.initialize.call(this, options);
        },

        events: {
            'click #showMore'          : 'showMore',
            'click .letter:not(.empty)': 'alpabeticalRender',
            'click .gotoForm'          : 'gotoForm',
            'click .company'           : 'gotoCompanyForm'
        },

        asyncLoadImgs: function (collection) {
            var ids = _.map(collection.toJSON(), function (item) {
                return item._id;
            });
            common.getImages(ids, '/customers/getCustomersImages');
        },

        gotoForm: function (e) {
            var id = $(e.target).closest('a').data('id');

            e.preventDefault();
            App.ownContentType = true;
            window.location.hash = '#easyErp/Persons/tform/' + id;
        },

        gotoCompanyForm: function (e) {
            var id = $(e.target).closest('a').data('id');

            e.preventDefault();
            window.location.hash = '#easyErp/Companies/form/' + id;
        },

        render: function () {
            var $currentEl = this.$el;

            $currentEl
                .find('#thumbnailContent')
                .append(this.template({collection: this.collection.toJSON()}));

            return this;
        },

        showMoreAlphabet: function (newModels) {
            var $holder = this.$el;
            var $created = $holder.find('#timeRecivingDataFromServer');
            var $showMore = $holder.find('#showMoreDiv');

            this.defaultItemsNumber += newModels.length;

            this.changeLocationHash(null, (this.defaultItemsNumber < 100) ? 100 : this.defaultItemsNumber, this.filter);

            $holder.append(this.template({collection: newModels.toJSON()}));
            $holder.append($created);
            $created.before($showMore);
            this.asyncLoadImgs(newModels);
        },

        exportToCsv: function () {
            var tempExportToCsvUrl = '';

            if (this.exportToCsvUrl) {
                tempExportToCsvUrl = this.exportToCsvUrl;
                if (this.filter) {
                    tempExportToCsvUrl += '&filter=' + encodeURIComponent(JSON.stringify(this.filter));
                }
                window.location = tempExportToCsvUrl;
            }
        },

        exportToXlsx: function () {
            var tempExportToXlsxUrl = '';

            if (this.exportToXlsxUrl) {
                tempExportToXlsxUrl = this.exportToXlsxUrl;
                if (this.filter) {
                    tempExportToXlsxUrl += '&filter=' + encodeURIComponent(JSON.stringify(this.filter));
                }
                window.location = tempExportToXlsxUrl;
            }
        }
    });

    return PersonsThumbnalView;
});
