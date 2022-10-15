import { Bytes } from '@graphprotocol/graph-ts'
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

export function handleDelegateChanged(event: DelegateChangedEvent): void {
  let tokenContract = TokenContract.bind(event.address)
  const memberAddress = event.params.delegator
  const memberId = Bytes.fromHexString(event.params.delegator.toHex())
  let member = Member.load(memberId)

  if (!member) {
    member = new Member(memberId)
    member.address = memberAddress.toHex()
    member.balance = tokenContract.balanceOf(memberAddress)
    member.delegateBalance = tokenContract.getVotes(memberAddress)
  }
  member.delegate = event.params.toDelegate
  member.save()
}

export function handleDelegateVotesChanged(
  event: DelegateVotesChangedEvent
): void {
  let tokenContract = TokenContract.bind(event.address)
  const memberAddress = event.params.delegate
  const memberId = Bytes.fromHexString(memberAddress.toHex())
  let member = Member.load(memberId)

  if (!member) {
    member = new Member(memberId)
    member.address = memberAddress.toHex()
    member.balance = tokenContract.balanceOf(memberAddress)
    member.delegate = tokenContract.delegates(memberAddress)
  }

  member.delegateBalance = event.params.newBalance
  member.save()
}

export function handleTransfer(event: TransferEvent): void {
  let entity = new Transfer(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.from = event.params.from
  entity.to = event.params.to
  entity.value = event.params.value
  entity.save()

  let tokenContract = TokenContract.bind(event.address)
  const memberAddress = event.params.to
  const memberId = Bytes.fromHexString(memberAddress.toHex())

  let member = Member.load(memberId)
  if (!member) {
    member = new Member(memberId)
    member.address = memberAddress.toHex()
    member.delegate = tokenContract.delegates(memberAddress)
  }

  member.balance = tokenContract.balanceOf(memberAddress)
  member.delegateBalance = tokenContract.getVotes(memberAddress)
  member.save()
}
