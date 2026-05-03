export const math = (function(x) {
    return {
        _randomFloat(a, b) { //provides a random float between two numbers
          let max =0;
          let min =0;
          if(a>b){
            max=a;
            min=b;
          }else{
            max=b;
            min=a;          
          }
            return Math.random() * (max - min) + min;
          },
        
          _randomInt(min, max) { //provides a random integer between two numbers
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min) + min);
          }
    }
})();