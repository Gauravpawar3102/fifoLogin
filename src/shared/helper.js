export function jwtDecrypt(token) {
    var base64Url = token.split(".")[1];
    var base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    var jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function(c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );

   
    return JSON.parse(jsonPayload);
  }


// export function qrParser(qrCode,inOrOut,userID,kitchenID){
//   Date.prototype.addDays = function(days) {
//     var date = new Date(this.valueOf());
//     date.setDate(date.getDate() + days);
//     return date;
//   }
//   const retVal = {}
//   const myArray = qrCode.split("#");
//   let temp = myArray[0].split('=')
//   let shelfLife = 0
//   let dom
//   if(temp[0] == 'recipe'){
//     retVal.recipeID = temp[1]
//     retVal.itemID = null
//   }else if(temp[0] == 'item'){
//     retVal.itemID = temp[1]
//     retVal.recipeID = null
//   }
//   temp = myArray[1].split('=')
//   if(temp[0] == 'brand'){
//     retVal.brandID = temp[1]
//   }
//   temp = myArray[2].split('=')
//   if(temp[0] == 'kitchen'){
//     if(inOrOut == 'in'){
//       retVal.destKitchen = kitchenID
//     } else if( inOrOut == 'out'){
//       retVal.sourceKitchen = kitchenID
//     }
//   }
//   temp = myArray[3].split('=')
//   if(temp[0] == 'shelfLife'){
//     shelfLife = Number(temp[1])
//   }
//   retVal.unitChange = null
//   dom = myArray[5]+'T'+myArray[6]
//   var date = new Date(dom)
//   retVal.expDate = date.addDays(shelfLife).toISOString().split('T')[0]
//   retVal.timestamp = new Date()
//   retVal.timestamp = retVal.timestamp.toISOString()
//   retVal.qrcode = qrCode
//   retVal.batchDetails = "nothing"
//   retVal.partnerID = userID
  
//   return retVal

// }


// i=4#1#1#35#.500 kg#2022-05-11#7:20:11 PM#1652190611602.6292
// <itemOrRecipeTypeIndicator>=<itemOrRecipeId>#<brandId>#<kitchenId>#<shelfLife>#<size> <unitForMeasure>#<Mfg>#<time> <AM/PM>#<timeInMilliSec+RandomNumber for making it unique>

export function qrParser(qrCode,inOrOut,userID,kitchenID){
  Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
  }
  const retVal = {}
  const myArray = qrCode.split("#");
  let temp = myArray[0].split('=')
  let shelfLife = 0
  let dom
  if(temp[0] == 'r'){
    retVal.recipeID = temp[1]
    retVal.itemID = null
  }else if(temp[0] == 'i'){
    retVal.itemID = temp[1]
    retVal.recipeID = null
  }
  temp = myArray[1]
  retVal.brandID = temp
  temp = myArray[2]
    if(inOrOut == 'in'){
      retVal.destKitchen = kitchenID
    } else if( inOrOut == 'out'){
      retVal.sourceKitchen = kitchenID
    }
  
  temp = myArray[3]
    shelfLife = Number(temp)
  
  retVal.unitChange = null
  dom = myArray[5]+'T'+myArray[6]
  var date = new Date(dom)
  retVal.expDate = date.addDays(shelfLife).toISOString().split('T')[0]
  retVal.timestamp = new Date()
  retVal.timestamp = retVal.timestamp.toISOString()
  retVal.qrcode = qrCode
  retVal.batchDetails = "nothing"
  retVal.partnerID = userID
  
  return retVal

}