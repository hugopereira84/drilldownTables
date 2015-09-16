/**
 * DRILLDOWN TABELAS
 * 
 * @author Hugo Pereira
 * @from https://john-dugan.com/jquery-plugin-boilerplate-explained/
 * 
 */
;(function ( $, window, document, undefined ) {
    
    var pluginName = 'drillDownTables';

    /*
        The "Plugin" constructor, builds a new instance of the plugin for the
        DOM node(s) that the plugin is called on. For example,
        "$('h1').pluginName();" creates a new instance of pluginName for
        all h1's.
    */
    // Create the plugin constructor
    function Plugin ( element, options ) {
        /*
            Provide local access to the DOM node(s) that called the plugin,
            as well local access to the plugin name and default options.
        */
        this.element = element;
        this._name = pluginName;
        this._defaults = $.fn.drillDownTables.defaults;
        
        this.options = $.extend( {
            //OPTIONS OF PLUGIN
        }, this._defaults, options );

        this.init();
        
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        arrayPluginsExtra: null,
        
        // Initialization logic
        init: function () {
            //General
            this.buildCache();
            this.bindEvents();
            
            //Personalized
            this.initExtraPlugins();
            this.formatTable();
        },
        
        

        // Remove plugin instance completely
        destroy: function() {
            /*
                The destroy method unbinds all events for the specific instance
                of the plugin, then removes all plugin data that was stored in
                the plugin instance using jQuery's .removeData method.

                Since we store data for each instance of the plugin in its
                instantiating element using the $.data method (as explained
                in the plugin wrapper below), we can call methods directly on
                the instance outside of the plugin initalization, ie:
                $('selector').data('plugin_myPluginName').someOtherFunction();

                Consequently, the destroy method can be called using:
                $('selector').data('plugin_myPluginName').destroy();
            */
            this.unbindEvents();
            this.$element.removeData();
        },

        // Cache DOM nodes for performance
        buildCache: function () {
            /*
                Create variable(s) that can be accessed by other plugin
                functions. For example, "this.$element = $(this.element);"
                will cache a jQuery reference to the elementthat initialized
                the plugin. Cached variables can then be used in other methods. 
            */
            this.$element = $(this.element);
        },

        // Bind events that trigger methods
        bindEvents: function() {
            
            var plugin = this;
            
            /**
             *
             *  Use the "call" method so that inside of the method being
             *  called, ie: "someOtherFunction", the "this" keyword refers
             *  to the plugin instance, not the event handler.
             *
             *  More: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/call
             */
            
            //O EVENTO EM BAIXO SÓ FAZ BIND UMA VEZ
            plugin.$element.off('click'+'.'+this._name, 'i.icofont-plus,  i.icofont-minus');
                
            
            plugin.$element.on('click'+'.'+this._name, 'i.icofont-plus,  i.icofont-minus',  function() {
                if($(this).hasClass('icofont-plus')){
                    plugin.expandContent.call(this, plugin);
                    
                    //validate if it has content, so it does not load content twice
                    var $elmTrSelected = $(this).parent().parent();
                    var attrElmTrSelected = $elmTrSelected.attr("data-hassons");
                    if (typeof attrElmTrSelected === 'undefined' || attrElmTrSelected < 1) {
                        plugin.getContent.call(this, plugin);
                    }
                    
                }else{
                    plugin.shrinkContent.call(this, plugin);
                    
                }
            });
        },
        
        // Unbind events that trigger methods
        unbindEvents: function() {
            /*
                Unbind all events in our plugin's namespace that are attached
                to "this.$element".
            */
            this.$element.off('.'+this._name);
        },

        //General methods
        generateHexColor: function(){
            return '#'+Math.floor(Math.random()*16777215).toString(16);
        },
        
        // Custom methods
        initExtraPlugins: function(){
            //Init with modal plugin
            self.arrayPluginsExtra = {'modal': new Loading()};
        },
        
        formatTable: function(){
            //add drilldown table class css
            this.$element.find('table').addClass('drillDownTables');
            
            //add class level to row 
            var $trRowBody = this.$element.find('tr:not(#table1Header)');
            $trRowBody.attr('data-levelDrillDown','1');
            
            //add icon
            $($trRowBody).each(function( index ) {
                //create a element with jquery
                var $firstColumnRow = $( this ).find('td:first');
                $firstColumnRow.html('<i class="icofont-plus"></i> '+$firstColumnRow.html());
            });
        },
        
        expandContent: function(){
            //Mudar icones
            $(this).removeClass('icofont-plus').addClass('icofont-minus');
            
            //Mostrar conteudo
            $(this).parent().parent().next().show();
        },
        shrinkContent: function(){
            //Mudar icones
            $(this).removeClass('icofont-minus').addClass('icofont-plus');
            
            //Esconder o conteudo
            $(this).parent().parent().next().hide();
        },
        
        
        getContent: function(plugin){
            var levelDrillDown = $(this).parent().parent().data('leveldrilldown');
            
            var $periodicityDrillDown  = $(this).parent().parent();
            var periodicityDrillDown  = $(this).parent().data('periodicity');
            
            var $idParent = $(this).parent().parent();
            var idparent = typeof $idParent.data('idparent') == 'undefined' ? '' : $idParent.data('idparent');
            
            var $idGrandParent = $idParent.parents(".wrapperTableDrillDownTR").prev();
            var idGrandParent    = typeof $idGrandParent.data('idparent') == 'undefined' ? '' : $idGrandParent.data('idparent');
            
            
//            $info = $idParent.parentsUntil("[class='wrapperTableDrillDownTABLE']" );
//            $info.css('border','2px solid '+ plugin.generateHexColor())
            
            
            //Buscar conteudo
            $.ajax({
                url: "/api/getDrillDownTablePsbGeral",
                //type: "POST",
                data: $("#filter_form").serialize() +"&drillDownLevel="+levelDrillDown+"&drillDownPeriodicity="+periodicityDrillDown+"&drillDownIdparent="+idparent+"&drillDownGrandIdparent="+idGrandParent,
                beforeSend: function (xhr) {
                    self.arrayPluginsExtra.modal.show();
                }
            }).done(function (data) {
                //Fix bug when u have lots of data
                if(typeof data.report === 'undefined'  ){
                    data = jQuery.parseJSON(data);
                }
                //Fix bug when u have lots of data
                
                
                //hide loading
                self.arrayPluginsExtra.modal.hide();
                
                //treat information
                var information = data.report.data;
                var lastDrillFlag = typeof data.report.lastDrill == 'undefined' ? 0 : data.report.lastDrill;
                
                
                var $rowInfor = '';
                var allRows = [];
                var numRow = 0;
                var numColumn;
                $.each(information, function( index, value ) {
                    var levelDrillDownNumber = Number(levelDrillDown) + 1;
                    numColumn = 0;
                   
                    
                    //Remove id, so it does not mess up, with columns
                    var idRecordDb = value.id == null ? '' : value.id;
                    delete value.id;
                    
                    
                   //add atributes to row
                    $rowInfor = $('<tr></tr>')
                                .attr({  'data-leveldrilldown': levelDrillDownNumber, 'data-idparent': idRecordDb });
                    
                   
                    
                    var percentageWidthCol = Math.floor(100/Object.keys(value).length); 
                    $.each(value, function( indexContentRow, valueContentRow ) {
                        //Validate if value is number, if so, it formates the number
                        valueContentRow = !isNaN(parseFloat(valueContentRow)) && isFinite(valueContentRow) ? 
                                    $.number(valueContentRow, 2, ',', '.'):
                                            valueContentRow;
                        
                        //Add icon drilldown to first column
                        var attrColumns = { html: valueContentRow, style:'width:'+percentageWidthCol+'%' };
                        if(numColumn == 0){
                            var showIconAdd = '';
                            if(lastDrillFlag === 0){
                                showIconAdd = '<i class="icofont-plus"></i>';
                            }
                            valueContentRow = showIconAdd+valueContentRow;
                            attrColumns = {  html: valueContentRow, 'data-periodicity' : periodicityDrillDown, style:'width:'+percentageWidthCol+'%' };
                        }
                        
                        $('<td/>',attrColumns).appendTo($rowInfor);
                        
                        numColumn++;
                    });
                    
                    //PUT content in array of rows
                    allRows.push($rowInfor);
                    
                    numRow++;
                    
                });
                
                //encapsular as coisas
                var $newRow = $('<tr></tr>', {'class':'wrapperTableDrillDownTR'});
                var $colsNewRow = $('<td></td>', {  'colspan': numColumn });
                var $newTable = $('<table></table>', {'class':'wrapperTableDrillDownTABLE',  'cellpadding':0, 'cellspacing':0});
                
                $newRow.append($colsNewRow);
                $colsNewRow.append($newTable);
                
                $.each(allRows, function( indexContentRow, valueContentRow ) {
                    $newTable.append($(this));
                });
                
                $newRow.insertAfter($periodicityDrillDown);
                //encapsular as coisas
                
                $periodicityDrillDown.attr('data-hassons', numRow);
                
            });
        }
    });

    /*
        Create a lightweight plugin wrapper around the "Plugin" constructor,
        preventing against multiple instantiations.

        More: http://learn.jquery.com/plugins/basic-plugin-creation/
    */
    $.fn.drillDownTables = function ( options ) {
        this.each(function() {
            if ( !$.data( this, "plugin_" + pluginName ) ) {
                /*
                    Use "$.data" to save each instance of the plugin in case
                    the user wants to modify it. Using "$.data" in this way
                    ensures the data is removed when the DOM element(s) are
                    removed via jQuery methods, as well as when the userleaves
                    the page. It's a smart way to prevent memory leaks.

                    More: http://api.jquery.com/jquery.data/
                */
                $.data( this, "plugin_" + pluginName, new Plugin( this, options ) );
            }else{
                
                //If plugin is init, it has to run the next functions again
                //VERY IMPORTANT: NEVER REMOVE
                $(this).data('plugin_drillDownTables').formatTable()
            }
        });
        /*
            "return this;" returns the original jQuery object. This allows
            additional jQuery methods to be chained.
        */
        return this ;
    };

    /*
        Attach the default plugin options directly to the plugin object. This
        allows users to override default plugin options globally, instead of
        passing the same option(s) every time the plugin is initialized.

        For example, the user could set the "property" value once for all
        instances of the plugin with
        "$.fn.pluginName.defaults.property = 'myValue';". Then, every time
        plugin is initialized, "property" will be set to "myValue".

        More: http://learn.jquery.com/plugins/advanced-plugin-concepts/
    */
    $.fn.drillDownTables.defaults = {
        property: 'value',
        onComplete: null
    };

})( jQuery, window, document );
