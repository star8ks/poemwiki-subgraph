import { Address, Bytes, ethereum } from '@graphprotocol/graph-ts'
import {
  Approval as ApprovalEvent,
  DelegateChanged as DelegateChangedEvent,
  DelegateVotesChanged as DelegateVotesChangedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  Transfer as TransferEvent,
  PoemWikiToken as TokenContract
} from "../generated/PoemWikiToken/PoemWikiToken"
import {
  Transfer,
  Member
} from "../generated/schema"

function loadOrCreate(contractAddress: Address, memberAddress: Address, block: ethereum.Block): Member {
  const memberId = Bytes.fromHexString(memberAddress.toHex())
  let member = Member.load(memberId)

  if (!member) {
    const tokenContract = TokenContract.bind(contractAddress)
    member = new Member(memberId)
    member.balance = tokenContract.balanceOf(memberAddress)
    member.delegateBalance = tokenContract.getVotes(memberAddress)
    member.delegate = tokenContract.delegates(memberAddress)
    member.block = block.number
    member.createdAt = block.timestamp
    member.updatedAt = block.timestamp
  }
  return member
}

export function handleDelegateChanged(event: DelegateChangedEvent): void {
  const memberAddress = event.params.delegator
  let member = loadOrCreate(event.address, memberAddress, event.block)

  member.delegate = event.params.toDelegate
  member.updatedAt = event.block.timestamp
  member.save()
}

export function handleDelegateVotesChanged(
  event: DelegateVotesChangedEvent
): void {
  const memberAddress = event.params.delegate
  let member = loadOrCreate(event.address, memberAddress, event.block)

  member.delegateBalance = event.params.newBalance
  member.updatedAt = event.block.timestamp
  member.save()
}


function updateBalance(contractAddress: Address, memberAddress: Address, block: ethereum.Block): void {
  let tokenContract = TokenContract.bind(contractAddress)

  let member = loadOrCreate(contractAddress, memberAddress, block)

  member.balance = tokenContract.balanceOf(memberAddress)
  member.delegateBalance = tokenContract.getVotes(memberAddress)
  member.updatedAt = block.timestamp
  member.save()
}

export function handleTransfer(event: TransferEvent): void {
  updateBalance(event.address, event.params.to, event.block)
  updateBalance(event.address, event.params.from, event.block)

  let entity = new Transfer(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.from = event.params.from
  entity.to = event.params.to
  entity.value = event.params.value
  entity.block = event.block.number
  entity.createdAt = event.block.timestamp
  entity.save()
}
