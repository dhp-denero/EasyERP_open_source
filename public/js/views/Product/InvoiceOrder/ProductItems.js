/**
 * Created by Roman on 27.04.2015.
 */
define([
    'text!templates/Product/InvoiceOrder/ProductItems.html',
    'text!templates/Product/InvoiceOrder/ProductInputContent.html',
    'text!templates/Product/InvoiceOrder/ProductItemsEditList.html',
    'text!templates/Product/InvoiceOrder/ItemsEditList.html',
    'text!templates/Product/InvoiceOrder/TotalAmount.html',
    'collections/Product/products',
    'populate',
    'helpers'
], function (productItemTemplate, ProductInputContent, ProductItemsEditList, ItemsEditList, totalAmount, productCollection, populate, helpers) {
    var ProductItemTemplate = Backbone.View.extend({
        el: '#productItemsHolder',

        events: {
            'click .addProductItem a': 'getProducts',
            "click .newSelectList li:not(.miniStylePagination)": "chooseOption",
            "click .newSelectList li.miniStylePagination": "notHide",
            "click .newSelectList li.miniStylePagination .next:not(.disabled)": "nextSelect",
            "click .newSelectList li.miniStylePagination .prev:not(.disabled)": "prevSelect",
            "click .current-selected": "showProductsSelect",
            "mouseenter .editable:not(.quickEdit), .editable .no-long:not(.quickEdit)": "quickEdit",
            "mouseleave .editable": "removeEdit",
            "click #cancelSpan": "cancelClick",
            "click #saveSpan": "saveClick",
            "click #editSpan": "editClick"
        },

        initialize: function (options) {
            var products;

            this.responseObj = {};
            this.taxesRate = 0.15;
            if (options && options.editable) {
                this.editable = options.editable;
            };

            if (options && options.balanceVisible) {
                this.visible = options.balanceVisible;
            };

            products = new productCollection();
            products.bind('reset', function () {
                this.products = products;
                this.filterProductsForDD();
            }, this);
        },

        template: _.template(productItemTemplate),


        getProducts: function (e) {
            e.preventDefault();
            e.stopPropagation();

            var target = $(e.target);
            var parrent = target.closest('tbody');
            var parrentRow = parrent.find('.productItem').last();
            var rowId = parrentRow.attr("data-id");
            var trEll = parrent.find('tr.productItem');


            if (rowId === undefined || rowId !== 'false') {
                if (!trEll.length) {
                    return parrent.prepend(_.template(ProductInputContent));
                }
                $(trEll[trEll.length - 1]).after(_.template(ProductInputContent));
            }

            return false;
        },

        filterProductsForDD: function () {
            var id = '.productsDd';
            var products = this.products.toJSON();

            this.responseObj[id] = [];
            this.responseObj[id] = this.responseObj[id].concat(_.map(products, function (item) {
                return {_id: item._id, name: item.name, level: item.projectShortDesc || ""};
            }));

            //$(id).text(this.responseObj[id][0].name).attr("data-id", this.responseObj[id][0]._id);

        },

        quickEdit: function (e) {
            var target = $(e.target);
            var trId = target.closest("tr");
            var tdId = target.closest("td");

            if (trId.find("#editSpan").length === 0) {
                tdId.append('<span id="editSpan" class=""><a href="javascript:;">e</a></span>');
                if (tdId.width() - 30 < tdId.find(".no-long").width()) {
                    tdId.find(".no-long").width(tdId.width() - 30);
                }
            }
        },

        removeEdit: function (e) {
            $('#editSpan').remove();
            $("td .no-long").css({width: "auto"});
        },

        editClick: function (e) {
            var parent = $(e.target).closest('td');
            var maxlength = parent.find(".no-long").attr("data-maxlength") || 20;
            var datePicker = parent.find('.datepicker');

            e.preventDefault();

            $('.quickEdit #editInput').remove();
            $('.quickEdit #cancelSpan').remove();
            $('.quickEdit #saveSpan').remove();

            if (this.prevQuickEdit) {
                if ($(this.prevQuickEdit).hasClass('quickEdit')) {
                    $('.quickEdit').text(this.text ? this.text : "").removeClass('quickEdit');
                }
            }


            parent.addClass('quickEdit');

            $('#editSpan').remove();

            this.text = $.trim(parent.text());

            parent.text('');
            parent.append('<input id="editInput" maxlength="' + maxlength + '" type="text" />');
            $('#editInput').val(this.text);

            if (datePicker.length) {
                $('#editInput').datepicker({
                    dateFormat: "d M, yy",
                    changeMonth: true,
                    changeYear: true
                }).addClass('datepicker');
            }

            this.prevQuickEdit = parent;

            parent.append('<span id="saveSpan" class="productEdit"><a href="javascript:;">c</a></span>');
            parent.append('<span id="cancelSpan" class="productEdit"><a href="javascript:;">x</a></span>');
            parent.find("#editInput").width(parent.find("#editInput").width() - 50);
        },

        saveClick: function (e) {
            e.preventDefault();

            var targetEl = $(e.target);
            var parent = targetEl.closest('td');
            var inputEl = parent.find('input');
            var val = inputEl.val();

            parent.removeClass('quickEdit').html('<span>' + val + '</span>');

            if (inputEl.hasClass('datepicker')) {
                parent.find('span').addClass('datepicker');
            }

            this.recalculateTaxes(parent);
        },

        cancelClick: function (e) {
            e.preventDefault();
            var text = this.text ? this.text : '';

            if (this.prevQuickEdit) {
                if ($(this.prevQuickEdit).hasClass('quickEdit')) {
                    $('.quickEdit').removeClass('quickEdit').html('<span>' + text + '</span>');
                }
            }
        },

        showProductsSelect: function (e, prev, next) {
            populate.showProductsSelect(e, prev, next, this);

            return false;
        },

        chooseOption: function (e) {
            var target = $(e.target);
            var parrent = target.parents("td");
            var trEl = target.parents("tr");
            var parrents = trEl.find('td');
            var _id = target.attr("id");
            var model = this.products.get(_id);
            var selectedProduct = model.toJSON();
            var taxes;
            var datePicker;
            var spanDatePicker;


            trEl.attr('data-id', model.id);
            //trEl.find('.datepicker').removeClass('notVisible');

            parrent.find(".current-selected").text(target.text()).attr("data-id", _id);

            $(parrents[1]).attr('class', 'editable').find('span').text(selectedProduct.info.description || '');
            $(parrents[2]).find('.datepicker').datepicker({
                dateFormat: "d M, yy",
                changeMonth: true,
                changeYear: true
            }).datepicker('setDate', new Date());
            $(parrents[2]).attr('class', 'editable');
            $(parrents[3]).attr('class', 'editable').find("span").text(1);
            $(parrents[4]).attr('class', 'editable').find('span').text(selectedProduct.info.salePrice);

            taxes = parseFloat(selectedProduct.info.salePrice) * this.taxesRate;
            taxes = taxes.toFixed(2);

            $(parrents[5]).text(taxes);

            $(".newSelectList").hide();

            datePicker = trEl.find('input.datepicker');
            spanDatePicker = trEl.find('span.datepicker');

            spanDatePicker.text(datePicker.val());
            datePicker.remove();

            this.calculateTotal(selectedProduct.info.salePrice);
        },

        recalculateTaxes: function (parent) {
            parent = parent.closest('tr');

            var quantity = parent.find('[data-name="quantity"] span').text();
            quantity = parseFloat(quantity);
            var cost = parent.find('[data-name="price"] span').text();
            cost = parseFloat(cost);

            var taxes = quantity * cost * this.taxesRate;

            taxes = taxes.toFixed(2);
            parent.find('.taxes').text(taxes);

            this.calculateTotal();
        },

        calculateTotal: function () {
            var thisEl = this.$el;
            var totalAmountEl = thisEl.find('#totalAmountContainer');

            var totalUntaxContainer = totalAmountEl.find('#totalUntaxes');
            var taxesContainer = totalAmountEl.find('#taxes');
            var totalContainer = totalAmountEl.find('#totalAmount');
            var resultForCalculate = thisEl.find('tr.productItem');

            var totalUntax = 0;
            var totalEls = resultForCalculate.length;
            var currentEl;
            var quantity;
            var cost;
            var dates = [];
            var date;

            if (totalEls) {
                for (var i = totalEls - 1; i >= 0; i--) {
                    currentEl = $(resultForCalculate[i]);
                    quantity = currentEl.find('[data-name="quantity"]').text();
                    cost = currentEl.find('[data-name="price"]').text();
                    totalUntax += (quantity * cost);
                    date = currentEl.find('.datepicker').text();
                    dates.push(date);
                }
            }

            totalUntax = totalUntax.toFixed(2);
            totalUntaxContainer.text(totalUntax);
            totalUntax = parseFloat(totalUntax);

            taxes = totalUntax * this.taxesRate;
            taxes = taxes.toFixed(2);
            taxesContainer.text(taxes);
            taxes = parseFloat(taxes);

            total = totalUntax + taxes;
            total = total.toFixed(2);
            totalContainer.text(total);

            date = helpers.minFromDates(dates);
            thisEl.find('#minScheduleDate span').text(date);
        },

        nextSelect: function (e) {
            this.showProductsSelect(e, false, true);
        },

        prevSelect: function (e) {
            this.showProductsSelect(e, true, false);
        },

        render: function (options) {
            var productsContainer;
            var totalAmountContainer;
            var thisEl = this.$el;
            var products;

            if(options && options.model){
                products = options.model.products;

                thisEl.html(_.template(ProductItemsEditList, {model: options.model}));

                if(products) {
                    productsContainer = thisEl.find('#productList');
                    productsContainer.append(_.template(ItemsEditList, {products: products, editable: this.editable}));
                    totalAmountContainer = thisEl.find('#totalAmountContainer');
                    totalAmountContainer.append(_.template(totalAmount, {model: options.model, balanceVisible: this.visible}));
                }
            } else {
                this.$el.html(this.template());
                totalAmountContainer = thisEl.find('#totalAmountContainer');
                totalAmountContainer.append(_.template(totalAmount, {model: null, balanceVisible: this.visible}));
            }

            return this;
        }
    });

    return ProductItemTemplate;
});