(function (factory) {

    if ( typeof define === 'function' && define.amd ) {

        // AMD. Register as an anonymous module.
        define([], factory);

    } else if ( typeof exports === 'object' ) {

        // Node/CommonJS
        module.exports = factory();

    } else {

        // Browser globals
        window.wNumb = factory();
    }

}(function(){

  'use strict';

var FormatOptions = [
  'decimals',
  'thousand',
  'mark',
  'prefix',
  'suffix',
  'encoder',
  'decoder',
  'negativeBefore',
  'negative',
  'edit',
  'undo'
];

// General

  // Reverse a string
  function strReverse ( a ) {
    return a.split('').reverse().join('');
  }

  // Check if a string starts with a specified prefix.
  function strStartsWith ( input, match ) {
    return input.substring(0, match.length) === match;
  }

  // Check is a string ends in a specified suffix.
  function strEndsWith ( input, match ) {
    return input.slice(-1 * match.length) === match;
  }

  // Throw an error if formatting options are incompatible.
  function throwEqualError( F, a, b ) {
    if ( (F[a] || F[b]) && (F[a] === F[b]) ) {
      throw new Error(a);
    }
  }

  // Check if a number is finite and not NaN
  function isValidNumber ( input ) {
    return typeof input === 'number' && isFinite( input );
  }

  // Provide rounding-accurate toFixed method.
  // Borrowed: http://stackoverflow.com/a/21323330/775265
  function toFixed ( value, exp ) {
    value = value.toString().split('e');
    value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp)));
    value = value.toString().split('e');
    return (+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp))).toFixed(exp);
  }


// Formatting

  // Accept a number as input, output formatted string.
  function formatTo ( decimals, thousand, mark, prefix, suffix, encoder, decoder, negativeBefore, negative, edit, undo, input ) {

    var originalInput = input, inputIsNegative, inputPieces, inputBase, inputDecimals = '', output = '';

    // Apply user encoder to the input.
    // Expected outcome: number.
    if ( encoder ) {
      input = encoder(input);
    }

    // Stop if no valid number was provided, the number is infinite or NaN.
    if ( !isValidNumber(input) ) {
      return false;
    }

    // Rounding away decimals might cause a value of -0
    // when using very small ranges. Remove those cases.
    if ( decimals !== false && parseFloat(input.toFixed(decimals)) === 0 ) {
      input = 0;
    }

    // Formatting is done on absolute numbers,
    // decorated by an optional negative symbol.
    if ( input < 0 ) {
      inputIsNegative = true;
      input = Math.abs(input);
    }

    // Reduce the number of decimals to the specified option.
    if ( decimals !== false ) {
      input = toFixed( input, decimals );
    }

    // Transform the number into a string, so it can be split.
    input = input.toString();

    // Break the number on the decimal separator.
    if ( input.indexOf('.') !== -1 ) {
      inputPieces = input.split('.');

      inputBase = inputPieces[0];

      if ( mark ) {
        inputDecimals = mark + inputPieces[1];
      }

    } else {

    // If it isn't split, the entire number will do.
      inputBase = input;
    }

    // Group numbers in sets of three.
    if ( thousand ) {
      inputBase = strReverse(inputBase).match(/.{1,3}/g);
      inputBase = strReverse(inputBase.join( strReverse( thousand ) ));
    }

    // If the number is negative, prefix with negation symbol.
    if ( inputIsNegative && negativeBefore ) {
      output += negativeBefore;
    }

    // Prefix the number
    if ( prefix ) {
      output += prefix;
    }

    // Normal negative option comes after the prefix. Defaults to '-'.
    if ( inputIsNegative && negative ) {
      output += negative;
    }

    // Append the actual number.
    output += inputBase;
    output += inputDecimals;

    // Apply the suffix.
    if ( suffix ) {
      output += suffix;
    }

    // Run the output through a user-specified post-formatter.
    if ( edit ) {
      output = edit ( output, originalInput );
    }

    // All done.
    return output;
  }

  // Accept a sting as input, output decoded number.
  function formatFrom ( decimals, thousand, mark, prefix, suffix, encoder, decoder, negativeBefore, negative, edit, undo, input ) {

    var originalInput = input, inputIsNegative, output = '';

    // User defined pre-decoder. Result must be a non empty string.
    if ( undo ) {
      input = undo(input);
    }

    // Test the input. Can't be empty.
    if ( !input || typeof input !== 'string' ) {
      return false;
    }

    // If the string starts with the negativeBefore value: remove it.
    // Remember is was there, the number is negative.
    if ( negativeBefore && strStartsWith(input, negativeBefore) ) {
      input = input.replace(negativeBefore, '');
      inputIsNegative = true;
    }

    // Repeat the same procedure for the prefix.
    if ( prefix && strStartsWith(input, prefix) ) {
      input = input.replace(prefix, '');
    }

    // And again for negative.
    if ( negative && strStartsWith(input, negative) ) {
      input = input.replace(negative, '');
      inputIsNegative = true;
    }

    // Remove the suffix.
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/slice
    if ( suffix && strEndsWith(input, suffix) ) {
      input = input.slice(0, -1 * suffix.length);
    }

    // Remove the thousand grouping.
    if ( thousand ) {
      input = input.split(thousand).join('');
    }

    // Set the decimal separator back to period.
    if ( mark ) {
      input = input.replace(mark, '.');
    }

    // Prepend the negative symbol.
    if ( inputIsNegative ) {
      output += '-';
    }

    // Add the number
    output += input;

    // Trim all non-numeric characters (allow '.' and '-');
    output = output.replace(/[^0-9\.\-.]/g, '');

    // The value contains no parse-able number.
    if ( output === '' ) {
      return false;
    }

    // Covert to number.
    output = Number(output);

    // Run the user-specified post-decoder.
    if ( decoder ) {
      output = decoder(output);
    }

    // Check is the output is valid, otherwise: return false.
    if ( !isValidNumber(output) ) {
      return false;
    }

    return output;
  }


// Framework

  // Validate formatting options
  function validate ( inputOptions ) {

    var i, optionName, optionValue,
      filteredOptions = {};

    if ( inputOptions['suffix'] === undefined ) {
      inputOptions['suffix'] = inputOptions['postfix'];
    }

    for ( i = 0; i < FormatOptions.length; i+=1 ) {

      optionName = FormatOptions[i];
      optionValue = inputOptions[optionName];

      if ( optionValue === undefined ) {

        // Only default if negativeBefore isn't set.
        if ( optionName === 'negative' && !filteredOptions.negativeBefore ) {
          filteredOptions[optionName] = '-';
        // Don't set a default for mark when 'thousand' is set.
        } else if ( optionName === 'mark' && filteredOptions.thousand !== '.' ) {
          filteredOptions[optionName] = '.';
        } else {
          filteredOptions[optionName] = false;
        }

      // Floating points in JS are stable up to 7 decimals.
      } else if ( optionName === 'decimals' ) {
        if ( optionValue >= 0 && optionValue < 8 ) {
          filteredOptions[optionName] = optionValue;
        } else {
          throw new Error(optionName);
        }

      // These options, when provided, must be functions.
      } else if ( optionName === 'encoder' || optionName === 'decoder' || optionName === 'edit' || optionName === 'undo' ) {
        if ( typeof optionValue === 'function' ) {
          filteredOptions[optionName] = optionValue;
        } else {
          throw new Error(optionName);
        }

      // Other options are strings.
      } else {

        if ( typeof optionValue === 'string' ) {
          filteredOptions[optionName] = optionValue;
        } else {
          throw new Error(optionName);
        }
      }
    }

    // Some values can't be extracted from a
    // string if certain combinations are present.
    throwEqualError(filteredOptions, 'mark', 'thousand');
    throwEqualError(filteredOptions, 'prefix', 'negative');
    throwEqualError(filteredOptions, 'prefix', 'negativeBefore');

    return filteredOptions;
  }

  // Pass all options as function arguments
  function passAll ( options, method, input ) {
    var i, args = [];

    // Add all options in order of FormatOptions
    for ( i = 0; i < FormatOptions.length; i+=1 ) {
      args.push(options[FormatOptions[i]]);
    }

    // Append the input, then call the method, presenting all
    // options as arguments.
    args.push(input);
    return method.apply('', args);
  }

  function wNumb ( options ) {

    if ( !(this instanceof wNumb) ) {
      return new wNumb ( options );
    }

    if ( typeof options !== "object" ) {
      return;
    }

    options = validate(options);

    // Call 'formatTo' with proper arguments.
    this.to = function ( input ) {
      return passAll(options, formatTo, input);
    };

    // Call 'formatFrom' with proper arguments.
    this.from = function ( input ) {
      return passAll(options, formatFrom, input);
    };
  }

  return wNumb;

}));
// ________________________________________________________________
// ________________________________________________________________
// ________________________________________________________________
// ________________________________________________________________
// ________________________________________________________________
// ________________________________________________________________

var nonLinearSlider = document.getElementById('range-slider');

noUiSlider.create(nonLinearSlider, {
  connect: true,
  behaviour: 'tap',
  start: [ 1000, 5000 ],

  range: {
    // Starting at 500, step the value by 500,
    // until 4000 is reached. From there, step by 1000.
    'min': [ 500 ],
    // '10%': [ 500, 500 ],
    // '50%': [ 4000, 1000 ],
    'max': [ 10000 ]
  }, 
    format: wNumb({
    decimals: 0,
    thousand: '',
    suffix: ' руб',
  })
});

var nodes = [
  document.getElementById('lower-value'), // 0
  document.getElementById('upper-value')  // 1
];

// Display the slider value and how far the handle moved
// from the left edge of the slider.
nonLinearSlider.noUiSlider.on('update', function ( values, handle, unencoded, isTap, positions ) {
  nodes[handle].innerHTML = values[handle] ;
});

$(document).ready(function(){

  });
$('.search-icon').on('click',  function(){
  $(".search").removeClass('search-box');
  $(".search").addClass('search-box__form');
     
     console.log('form');
});


$(document).mouseup(function (e)
{
    var container = $(".search-box__form");
    if (!container.is(e.target) && container.has(e.target).length === 0) {
      // console.log('Клик снаружи.');
      $(".search").removeClass('search-box__form');
      $(".search").addClass('search-box');
    } 
    // else {
    //   console.log('Клик внутри.');
    // }
});


   $(".burger").click(function(event) {   
    if($(".header__top").is('.header__top__open')){
      $(".burger").removeClass('burger__cross')
      $(".header__top__open").removeClass('header__top__open');
      $("body").removeClass('no-scroll');
      
    }
    else{
      $(".burger").addClass('burger__cross')
       $(".header__top").addClass('header__top__open');
       $("body").addClass('no-scroll');
    }
   });



$('#toggle').on('click', function(){
  $('.catalog').toggleClass('with-filter');
  $('.button').toggleClass('button_open');
  console.log('filter');
})
var StartDocumentScroll = $(document).scrollTop();
var myAwesomeIdea;

$(document).on('scroll' , function(event) {
  clearTimeout(myAwesomeIdea);
  myAwesomeIdea = setTimeout(function(){
    console.log('sroll stoped');
  }, 500);

 

    var DocumentScrolTop = $(document).scrollTop();
    var TopCatalog = $('.catalog').offset().top; 
    var CatalogBottom = TopCatalog + $('.catalog').height();
    var CatalogFilterHeigth = $('.catalog__filter').height();
    var ScrollCatalogBottom = CatalogBottom - CatalogFilterHeigth;

  // Scroll Down
    if(StartDocumentScroll < DocumentScrolTop){
      StartDocumentScroll = DocumentScrolTop;
        console.log('down');
        if(TopCatalog < DocumentScrolTop && ScrollCatalogBottom > DocumentScrolTop){
          $('.catalog__filter').offset({top: DocumentScrolTop});
        }
    }

  // Scroll Up
    else {
      StartDocumentScroll = DocumentScrolTop;
       var TopCatalogFilter = $('.catalog__filter').offset().top;
        console.log('up');
        var WindowBottom = DocumentScrolTop + $(window).height();
        var CatalogFilterBottom = TopCatalogFilter + CatalogFilterHeigth;

        if(WindowBottom < CatalogFilterBottom && WindowBottom + CatalogFilterHeigth > TopCatalog){
          $('.catalog__filter').offset({top: WindowBottom - CatalogFilterHeigth});        
        }
    }

    if(TopCatalog < DocumentScrolTop && ScrollCatalogBottom > DocumentScrolTop){
        $('.catalog__filter').offset({top: DocumentScrolTop});
    }
       if(DocumentScrolTop > ScrollCatalogBottom) {
        $('.catalog__filter').offset({top: ScrollCatalogBottom});
      }
        else if(DocumentScrolTop < TopCatalog) {
          $('.catalog__filter').offset({top: TopCatalog});  
        }

});

function throttle(fn, wait) {
  var time = Date.now();
  return function() {
    if ((time + wait - Date.now()) < 0) {
      fn();
      time = Date.now();
    }
  }
}