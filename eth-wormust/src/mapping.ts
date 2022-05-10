/* import { BigInt } from "@graphprotocol/graph-ts" */
import {
  wormUST,
  Transfer
} from "../generated/wormUst/wormUst"
import { CirculatingSupply, Mint, Burn, CirculatingSupplyByDate, CirculatingSupplyByMonth } from "../generated/schema"

export function handleTransfer(event: Transfer): void {
  if(event.params.from.toHex() == '0x0000000000000000000000000000000000000000') {
    let mint = Mint.load(event.transaction.hash.toHex());
    if(!mint) {
      mint = new Mint(event.transaction.hash.toHex());
    }
  
    mint.value = event.params.value;
  
    mint.save();
  }

  if(event.params.to.toHex() == '0x0000000000000000000000000000000000000000') {
    let burn = Burn.load(event.transaction.hash.toHex());
    if(!burn) {
      burn = new Burn(event.transaction.hash.toHex());
    }
  
    burn.value = event.params.value;
  
    burn.save();
  }

  if(event.params.from.toHex() == '0x0000000000000000000000000000000000000000' || event.params.to.toHex() == '0x0000000000000000000000000000000000000000') {
    let contract = wormUST.bind(event.address);
    let supply = CirculatingSupply.load(event.block.number.toString());

    if(!supply) {
      supply = new CirculatingSupply(event.block.number.toString());
    }

    let tokenSupplyRes = contract.totalSupply();
    supply.supply = tokenSupplyRes;
    supply.timestamp = event.block.timestamp;

    supply.save();
    

    let date = new Date(event.block.timestamp.toI64() * 1000); // to milliseconds
    let y = date.getUTCFullYear().toString();
    let m = (date.getUTCMonth() + 1).toString();
    m = m.length < 2? '0' + m : m;
    let d = date.getUTCDate().toString();
    d = d.length < 2? '0' + d : d;

    let dateStr = y + '/' + m + '/' + d;
    let monthStr = y + '/' + m;

    let supplyByDate = CirculatingSupplyByDate.load(dateStr);
    if(!supplyByDate) {
      supplyByDate = new CirculatingSupplyByDate(dateStr);
      supplyByDate.timestamp = event.block.timestamp;
      supplyByDate.supply = tokenSupplyRes;
    }

    else if(supplyByDate.timestamp < event.block.timestamp) {
        supplyByDate.timestamp = event.block.timestamp;
        supplyByDate.supply = tokenSupplyRes;
    }
    
    supplyByDate.save();

    let supplyByMonth = CirculatingSupplyByMonth.load(monthStr);
    if(!supplyByMonth) {
      supplyByMonth = new CirculatingSupplyByMonth(monthStr);
      supplyByMonth.timestamp = event.block.timestamp;
      supplyByMonth.supply = tokenSupplyRes;
    }

    else if(supplyByMonth.timestamp < event.block.timestamp) {
        supplyByMonth.timestamp = event.block.timestamp;
        supplyByMonth.supply = tokenSupplyRes;
    }
    
    supplyByMonth.save();
  }
}
