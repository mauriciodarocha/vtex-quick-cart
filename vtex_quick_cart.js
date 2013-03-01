/*
  @author: Mauricio Rocha
  @contributors: Marcelo Anderson
  
  uso simples:
  -=-=-=-=-=-

    Adiciona em seu template:
      <div class="tpl-cart tpl-cart-dropdown">
          <a href="/Site/Carrinho.aspx" class="cart-link">
              <span class="cart-title">Meu Carrinho</span>
              <span class="cart-summary clearfix">
                  <span class="amount-items"></span>
                  <span class="total-price-container"></span>
              </span>
          </a>
          <div class="cart-dropdown"></div>
      </div>

    Adicione em seu template dentro de <script></script> ou dentro de um arquivo javascript.
      jQuery.vtex_quick_cart();


  uso (com refresh)*:
  -=-=-=-=-=-=-=-=-=-
      Quando quiser fazer o refresh (recarregar) do carrinho, execute [nome_da_variável].refresh();

      Ex.: 
        var meu_carrinho = jQuery.vtex_quick_cart();
        meu_carrinho.refresh();

      *Use desta maneira quando quiser chamar o carrinho de outro código para remontá-lo.
      Mais utilizado quando há um botão que adiciona um produto dinamicamente e 
      você deseja que o usuário (re)veja o(s) item(ns) adicionados no carrinho.


  opções:
  -=-=-=-

    options = {
      container: ".cart-dropdown",
      items: ".amount-items",
      list: ".cart-list",
      price_label: "R$ ", 
      total_price_currency: "R$ ", 
      total_price_container: ".total-price-container",
      total_price_label: "", // Ex. "Valor total:", "Total:"
      cart_conclude:null,
      remove_btn:false,
      finish_order_btn: ".finish-order-btn",
      finish_order_btn_link: "/Site/Carrinho.aspx",
      finish_order_btn_text: "Finalizar compra",
      items_text: ['nenhum item','item','itens'],
      hover: ".tpl-cart",
      callback:null,
      cart_empty_cb:null,
      total_price_class: '.total-price',
      total_price_label_class: '.total-price-label',
      dropdown: true, // Se false, o dropdown não carregará lista de itens, portanto não será mostrado.
      show_images: true
    }
    
  exemplo com opções alteradas:
  -=-=-=-=-=-=-=-=-=-=-=-=-=-=-

      jQuery.vtex_quick_cart({
        items_text: ['nenhum produto','produto','produtos'] // 0 = nenhum produto, 1 = 1 produto, 2 ou +, 2 produtos
      });

*/
;(function($,window,document,undefined){
    var _plugin_qc = function(_qc_options)
    {
      var _qc_settings = jQuery.extend({
        container: ".cart-dropdown",
        items: ".amount-items",
        list: ".cart-list",
        price_label: "R$ ", 
        total_price_currency: "R$ ", 
        total_price_container: ".total-price-container",
        total_price_label: "", // Ex. "Valor total:", "Total:"
        cart_conclude:null,
        remove_btn:false,
        finish_order_btn: ".finish-order-btn",
        finish_order_btn_link: "/Site/Carrinhoxxxxxxxxxxxx.aspx",
        finish_order_btn_text: "Finalizar compra",
        items_text: ['nenhum item','item','itens'],
        hover: ".tpl-cart",
        callback:null,
        cart_empty_cb:null,
        total_price_class: '.total-price',
        total_price_label_class: '.total-price-label',
        dropdown: true, // If set to false, dropdown will not get list of items. Hence, it will not be shown.
        show_images: true
      }, _qc_options);

      var _quick_cart = {
        temp:null,
        total_itens:0,
        total:'0,00', // string to show BRZ format
        empty_cart:null,
        itens: 0,
        data:null,
        images:null,
        init: function()
        {
          _quick_cart.get.cart.total_itens();
        },
        get:
        {
          cart:
          {
            items: function() 
            {
              jQuery.ajax({
                url:"/orderformitemssummary",
                type: "GET",
                dataType: "json",
                cache: false,
                success: function(data){
                _quick_cart.data = data;
                _quick_cart.mount.cart.dropdown();
                }
              });
            },
            total: function()
            {
              jQuery.ajax({
                url: "/no-cache/cartamounttotal",
                type: "GET",
                cache: false,
                success: function(data){
                _quick_cart.total = data;
                _quick_cart.set.cart.total();
                if(_qc_settings.dropdown)
                  _quick_cart.get.cart.items();
                }
              });
            },
            total_itens: function()
            {
              jQuery.ajax({
                url: "/no-cache/cartamountitems",
                type: "GET",
                cache: false,
                success: function(data){
                _quick_cart.total_itens = 0;
                _quick_cart.total_itens = parseInt(data);
                if(_quick_cart.total_itens>0)
                {
                  _quick_cart.set.cart.items();
                  _quick_cart.get.cart.total();
                }
                else
                  _quick_cart.set.cart.empty();
                }
              });
            },
            text: function()
            {
              var plural = _qc_settings.items_text.length-1;
              var singular = _qc_settings.items_text.length-1==2?1:0;
              var plural_padding = typeof(_qc_settings.items_text[plural])=="undefined"?"":" ";
              var singular_padding = typeof(_qc_settings.items_text[singular])=="undefined"?"":" ";

              var items_text2show = parseInt(_quick_cart.total_itens)>1?(_quick_cart.total_itens+plural_padding+_qc_settings.items_text[plural]):_quick_cart.total_itens==0?_qc_settings.items_text[0]:(_quick_cart.total_itens+singular_padding+_qc_settings.items_text[singular]);
              return items_text2show;
            },
            images: function ()
            {
              var get_info = function(ndx,sku)
              {
                if(typeof sku == "undefined") return false;

                jQuery.get("/produto/sku/"+sku,function(data){
                // ArchiveTypeId = 3
                for(var i in data[0].Images[0])
                {
                  if(data[0].Images[0][i].ArchiveTypeId==3)
                  {
                  _url = data[0].Images[0][i].Path;
                  _quick_cart.images[ndx]["path"] = _url;
                  break;
                  }
                }
                _quick_cart.set.cart.images(ndx);
                });
              }
              for(var i in _quick_cart.images)
              {
                if(typeof _quick_cart.images[i] != "undefined" && typeof _quick_cart.images[i] != "function")
                get_info(i,_quick_cart.images[i]["sku"]);
                else
                break;
              }
            }
          }
        },
        mount:
        {
          cart: 
          {
            dropdown: function() 
            {
              var ndx = 0,_li,_span,_col_0,_col_1,_col_2,_col_3,
              container_class = _qc_settings.list.split(".")[1]||"",
              cart_container = jQuery("<ul/>").addClass(container_class);
            
              _quick_cart.images = new Array;
              for(var key in _quick_cart.data)
              {
                if(typeof _quick_cart.data[key]=="function") break;

                var sku = _quick_cart.data[key].ProductVariantId;
                var _li = jQuery('<li>').addClass('row').addClass('row-'+ndx).attr("sku",sku);
                var _set = new Object;
                _set["ndx"] = ndx;
                _set["sku"] = sku;
                _quick_cart.images.push(_set);

                // product img & name
                _col_0 = jQuery("<div>").addClass("col").addClass("col-0");
                _span_img = jQuery("<span>").addClass("_qc-img").addClass("_qc-img-"+ndx).attr("sku",sku);
                
                if(_qc_settings.show_images)
                  jQuery(_col_0).append(_span_img);
                
                _span_product = jQuery("<span>").addClass("_qc-product").addClass("_qc-product-"+ndx);
                jQuery(_span_product).text(_quick_cart.data[key].ProductVariantName);
                jQuery(_col_0).append(_span_product);

                // quantity and quantity selectors
                _col_1 = jQuery("<div>").addClass("col").addClass("col-1");
                var qty_input = _quick_cart.data[key].Amount;
                var _input = jQuery('<input type="text" value="'+qty_input+'" maxlength="2" />').attr('ndx',ndx).addClass('_qty').addClass('_qty-'+ndx).attr('sku',sku);
                var _add = jQuery('<a>',{'ndx':ndx}).addClass('_add').addClass('_add-'+ndx).text('+');
                var _remove = jQuery('<a>',{'ndx':ndx}).addClass('_remove').addClass('_remove-'+ndx).text('-');
                jQuery(_col_1).append(_input).append(_add).append(_remove);

                // price
                var _val = _quick_cart.data[key].Value.toFixed(2).toString().replace(/\./,",");
                var _price = _qc_settings.price_label+_val;
                _col_2 = jQuery("<div>").addClass("col").addClass("col-2").html(_price);

                if(_qc_settings.remove_btn)
                {
                  // remove button
                  var _skuRm =  _quick_cart.data[key].Id;
                  _remove_btn = jQuery('<a>').addClass('remove-link').addClass('remove-link-'+ndx).attr('sku',_skuRm).html("x");
                  _col_3 = jQuery("<div>").addClass("col").addClass("col-3");
                  jQuery(_col_3).append(_remove_btn);
                  jQuery(_li).append(_col_0).append(_col_1).append(_col_2).append(_col_3);
                }
                else
                  jQuery(_li).append(_col_0).append(_col_1).append(_col_2);

                jQuery(cart_container).append(_li);
                ndx++;
              }

              jQuery(_qc_settings.container).html(cart_container);
              
              _quick_cart.set.events();
              _quick_cart.set.cart.conclusion();
              _quick_cart.set.cart.active();

              if(_qc_settings.show_images)
                _quick_cart.get.cart.images();
              else 
                _quick_cart.skus = null;
            }
          }
        },
        set:
        {
          cart:
          {
            items: function()
            {
              var items_text = _quick_cart.get.cart.text();
              jQuery(_qc_settings.items).html(items_text);
            },
            total: function()
            {
              var total = _qc_settings.total_price_currency+_quick_cart.total;
              jQuery(_qc_settings.total_price_container).html(total);
            },
            empty: function()
            {
              jQuery(_qc_settings.hover).unbind().removeClass('active').addClass("empty");
              var items_text = _quick_cart.get.cart.text();
              _quick_cart.set.cart.items(items_text);

              if(jQuery(_qc_settings.container).length>0)
                jQuery(_qc_settings.container).html('');
              
              if(typeof _qc_settings.cart_empty_cb=="function")
                _qc_settings.cart_empty_cb();
            },
            conclusion: function()
            {
              var conclusion_wrapper = jQuery("<div/>").addClass("cart_conclude");
              if(jQuery(_qc_settings.cart_conclude).length>0)
                var conclusion_wrapper = jQuery(_qc_settings.cart_conclude);

              var finish_order_btn = _qc_settings.finish_order_btn.substring(1)||"";
              var btn = jQuery("<a/>").addClass(finish_order_btn).attr("href",_qc_settings.finish_order_btn_link).html(_qc_settings.finish_order_btn_text);
              jQuery(conclusion_wrapper).append(btn);

              var total = _qc_settings.total_price_currency+_quick_cart.total;
              var total_price = jQuery('<span>').addClass(_qc_settings.total_price_class.substring(1)).text(total);

              var total_price_container_class = _qc_settings.total_price_container.substring(1)||"";
              var total_price_container = jQuery("<div/>").addClass(total_price_container_class).addClass(total_price_container_class+"-0").addClass('active').html(total_price);

              if(!!_qc_settings.total_price_label)
              {
                if(!!_qc_settings.total_price_label_class&&/\./.test(_qc_settings.total_price_label_class))
                var total_price_label = jQuery('<span>').addClass(_qc_settings.total_price_label_class.substring(1)).html(_qc_settings.total_price_label);
                else
                var total_price_label = jQuery('<span>').html(_qc_settings.total_price_label);

                jQuery(total_price_container).prepend(total_price_label);
              }
              
              jQuery(conclusion_wrapper).append(total_price_container);
              jQuery(_qc_settings.container).append(conclusion_wrapper);
            },
            images: function(ndx)
            {
              var _path = _quick_cart.images[ndx]["path"];
              var _ndx = _quick_cart.images[ndx]["ndx"];
              jQuery("<img>").one("load",function(){
                jQuery("._qc-img-"+_ndx).html(this);
              }).attr({"src":_path});
              // + "?" + new Date().getTime()
            },
            active: function()
            {
              jQuery(_qc_settings.hover).removeClass("empty").addClass("available");
            
              if(typeof _qc_settings.callback=="function")
                _qc_settings.callback();
            }
          },
          events: function()
          {
            var cart_hover = function()
            {
              jQuery(_qc_settings.hover).hover(function()
              {
                  jQuery(this).addClass("active");
                },
                function()
                {
                  jQuery(_qc_settings.hover).removeClass("active");
                  
              });
            }
            var cart_remove_item = function(_skuRm)
            {
              var _url = '/no-cache/CarrinhoRemove.aspx?IdSkuRm='+_skuRm
              jQuery.ajax({
                url:_url,
                success: function(data)
                {
                  _quick_cart.init();
                }
              });
            }
            var cart_remove_item_binding = function()
            {
              jQuery(_qc_settings.container).find('.remove-link').click(function(){
                _skuRm = jQuery(this).attr('sku');
                cart_remove_item(_skuRm);
              });
            }
            var cart_update = function(_sku,_val)
            {
              jQuery(_qc_settings.container).find('._qty,._add,._remove').removeClass('active').removeClass('keydown_binding');
              jQuery(_qc_settings.container).find('._qty').attr('readonly',true);
              var _url = '/no-cache/CarrinhoUpdate.aspx?IdSku='+_sku+'&quantidade='+_val;
              jQuery.ajax({
                url:_url,
                success: function(data)
                {
                  _quick_cart.init();
                }
              });
            }
            var keydown_binding = function()
            {
              jQuery(_qc_settings.container).find('._qty:not(".keydown_binding")').addClass('keydown_binding').keydown(function(e){
                var key = e.charCode || e.keyCode || 0;
                
                return (
                  key == 8 || 
                  key == 9 ||
                  key == 46 ||
                  (key >= 37 && key <= 40) ||
                  (key >= 48 && key <= 57) ||
                  (key >= 96 && key <= 105)
                  );

              });
            }
            var selectors_bindings = function()
            {
              jQuery(_qc_settings.container).find('._add:not(".active")').addClass('active').click(function(){
                _ndx = jQuery(this).attr('ndx');
                _val = parseInt(jQuery('._qty-'+_ndx).val());
                _val=_val>=99?99:_val+1;
                jQuery('._qty-'+_ndx).val(_val).change();
              });
              jQuery(_qc_settings.container).find('._remove:not(".active")').addClass('active').click(function(){
                _ndx = jQuery(this).attr('ndx');
                _val = parseInt(jQuery('._qty-'+_ndx).val());
                _val=_val<=1?1:_val-1;
                jQuery('._qty-'+_ndx).val(_val).change();
              });
              jQuery(_qc_settings.container).find('._qty:not(".active")').addClass('active').keyup(function(e){
                if(jQuery(this).val()<1) jQuery(this).val(1);
                else if(jQuery(this).val()>99) jQuery(this).val(99);
              }).change(function(){
                _sku = jQuery(this).attr('sku');
                _val = jQuery(this).val();              
                cart_update(_sku,_val);
              });
            }
            cart_hover();
            cart_remove_item_binding();
            keydown_binding();
            selectors_bindings();
          }
        },
        refresh: function()
        {
          _quick_cart.init();
        }
      };

      _quick_cart.init();

      /* Why? Only to keep the settings/options once defined. */
      var expose = function()
      {
        return {
          refresh: _quick_cart.refresh
        }
      };

      return expose();
    };

    jQuery.vtex_quick_cart = function(_qc_options){
      return new _plugin_qc(_qc_options);
    };

})(jQuery,window,document);