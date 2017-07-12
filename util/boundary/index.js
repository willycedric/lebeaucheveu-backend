exports = module.exports = function boundary(key) {
	switch(key){
        case "five":
        case "FIVE":{
            return 5;
        }       
        case "ten":
        case "TEN":
        {
            return 10;
        }
        case "fifteen":
        case "FIFTEEN":
        {
            return 15;            
        }
        case "twenty":
        case "TWENTY":
        {
            return 20;
        }
        default:
        break;
    }	
}