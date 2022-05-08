/* import { BigInt } from "@graphprotocol/graph-ts" */
import {
  atUST,
  Approval,
  OwnershipTransferred,
  Transfer
} from "../generated/atUST/atUST"
import { CirculatingSupply, Mint, Burn, CirculatingSupplyByDate, CirculatingSupplyByMonth } from "../generated/schema"

export function handleApproval(event: Approval): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  //let entity = ExampleEntity.load(event.transaction.from.toHex())

  // Entities only exist after they have been saved to the store;
  // `null` checks allow to create entities on demand
  /* if (!entity) {
    entity = new ExampleEntity(event.transaction.from.toHex())

    // Entity fields can be set using simple assignments
    entity.count = BigInt.fromI32(0)
  }

  // BigInt and BigDecimal math are supported
  entity.count = entity.count + BigInt.fromI32(1)

  // Entity fields can be set based on event parameters
  entity.owner = event.params.owner
  entity.spender = event.params.spender

  // Entities can be written to the store with `.save()`
  entity.save() */

  // Note: If a handler doesn't require existing field values, it is faster
  // _not_ to load the entity from the store. Instead, create it fresh with
  // `new Entity(...)`, set the fields that should be updated and save the
  // entity back to the store. Fields that were not set or unset remain
  // unchanged, allowing for partial updates to be applied.

  // It is also possible to access smart contracts from mappings. For
  // example, the contract that has emitted the event can be connected to
  // with:
  //
  // let contract = Contract.bind(event.address)
  //
  // The following functions can then be called on this contract to access
  // state variables and other data:
  //
  // - contract.allowance(...)
  // - contract.approve(...)
  // - contract.balanceOf(...)
  // - contract.decimals(...)
  // - contract.decreaseAllowance(...)
  // - contract.increaseAllowance(...)
  // - contract.name(...)
  // - contract.owner(...)
  // - contract.source(...)
  // - contract.sourceAddress(...)
  // - contract.symbol(...)
  // - contract.totalSupply(...)
  // - contract.transfer(...)
  // - contract.transferFrom(...)
}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}

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
    let contract = atUST.bind(event.address);
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
