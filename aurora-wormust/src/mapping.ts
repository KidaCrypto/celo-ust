import { BigInt } from "@graphprotocol/graph-ts";
import {
  wormUST,
  Approval,
  OwnershipTransferred,
  Transfer
} from "../generated/wormUST/wormUST"
import { CirculatingSupplyByDate, CirculatingSupplyByMonth, CurrentSupply } from "../generated/schema"


export function handleTransfer(event: Transfer): void {
  if(!event) {
    return;
  }

  let currentSupply = CurrentSupply.load('1');
  if(!currentSupply) {
    currentSupply = new CurrentSupply('1');
    currentSupply.supply = new BigInt(0);
    currentSupply.timestamp = new BigInt(0);
  }
  

  if(event.params.from.toHex() == '0x0000000000000000000000000000000000000000') {
    currentSupply.supply = currentSupply.supply + event.params.value;
    currentSupply.timestamp = event.block.timestamp;
    currentSupply.save();
  }

  if(event.params.to.toHex() == '0x0000000000000000000000000000000000000000') {
    currentSupply.supply = currentSupply.supply - event.params.value;
    currentSupply.timestamp = event.block.timestamp;
    currentSupply.save();
  }

  if(event.params.from.toHex() == '0x0000000000000000000000000000000000000000' || event.params.to.toHex() == '0x0000000000000000000000000000000000000000') {
    let contract = wormUST.bind(event.address);
    
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
      supplyByDate.supply = currentSupply.supply;
    }

    else if(supplyByDate.timestamp < event.block.timestamp) {
        supplyByDate.timestamp = event.block.timestamp;
        supplyByDate.supply = currentSupply.supply;
    }
    
    supplyByDate.save();

    let supplyByMonth = CirculatingSupplyByMonth.load(monthStr);
    if(!supplyByMonth) {
      supplyByMonth = new CirculatingSupplyByMonth(monthStr);
      supplyByMonth.timestamp = event.block.timestamp;
      supplyByMonth.supply = currentSupply.supply;
    }

    else if(supplyByMonth.timestamp < event.block.timestamp) {
        supplyByMonth.timestamp = event.block.timestamp;
        supplyByMonth.supply = currentSupply.supply;
    }
    
    supplyByMonth.save();
  }
}
