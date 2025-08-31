import { BigInt, Bytes, ethereum, log } from '@graphprotocol/graph-ts'
import {
  ProposalCanceled as ProposalCanceledEvent,
  ProposalCreated as ProposalCreatedEvent,
  ProposalExecuted as ProposalExecutedEvent,
  ProposalThresholdSet as ProposalThresholdSetEvent,
  QuorumNumeratorUpdated as QuorumNumeratorUpdatedEvent,
  VoteCast as VoteCastEvent,
  VoteCastWithParams as VoteCastWithParamsEvent,
  VotingDelaySet as VotingDelaySetEvent,
  VotingPeriodSet as VotingPeriodSetEvent
} from "../generated/Governor/Governor"
import {
  Proposal,
  ProposalActivity,
  GovernorSettingActivity,
  VoteCast
} from "../generated/schema"

// const ProposalActivityType = {
//   CREATE: 'CREATE',
//   CANCEL: 'CANCEL',
//   EXECUTE: 'EXECUTE'
// }
function saveProposalActivity(id: string, activityType: string,
  proposalId: BigInt, member: Bytes, block: ethereum.Block, tx: Bytes): void {
  let activity = new ProposalActivity(id)
  // Convert BigInt to Bytes via safe helper (pads odd-length hex)
  activity.proposal = bigIntToBytes(proposalId)
  activity.activity = activityType
  activity.member = member
  activity.block = block.number
  activity.createdAt = block.timestamp
  activity.tx = tx.toHex()
  activity.save()
}

// const GovernorSettingActivityType = {
//   ProposalThresholdSet: 'ProposalThresholdSet',
//   QuorumNumeratorUpdated: 'QuorumNumeratorUpdated',
//   VotingDelaySet: 'VotingDelaySet',
//   VotingPeriodSet: 'VotingPeriodSet'
// }
function saveGovernorActivity(id: string, activityType: string, member: Bytes,
  oldValue: BigInt, newValue: BigInt, block: ethereum.Block, tx: Bytes): void {
  let activity = new GovernorSettingActivity(id)
  activity.activity = activityType
  activity.member = member
  activity.oldValue = oldValue
  activity.newValue = newValue
  activity.block = block.number
  activity.createdAt = block.timestamp
  activity.tx = tx.toHex()
  activity.save()
}

export function handleProposalCreated(event: ProposalCreatedEvent): void {
  // Convert proposalId via helper to ensure even-length hex
  const id = bigIntToBytes(event.params.proposalId)
  let proposal = new Proposal(id)
  proposal.proposalId = event.params.proposalId
  proposal.proposer = event.params.proposer
  proposal.targets = event.params.targets.map<Bytes>(target => Bytes.fromHexString(target.toHexString()))
  proposal.values = event.params.values
  proposal.signatures = event.params.signatures
  proposal.calldatas = event.params.calldatas
  proposal.startBlock = event.params.startBlock
  proposal.endBlock = event.params.endBlock
  proposal.description = event.params.description
  proposal.canceled = false
  proposal.executed = false
  proposal.block = event.block.number
  proposal.createdAt = event.block.timestamp
  proposal.updatedAt = event.block.timestamp
  proposal.proposeTx = event.transaction.hash
  proposal.save()

  saveProposalActivity(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString(),
    'CREATE',
    event.params.proposalId,
    event.transaction.from,
    event.block,
    event.transaction.hash
  )
}

export function handleProposalCanceled(event: ProposalCanceledEvent): void {
  saveProposalActivity(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString(),
    'CANCEL',
    event.params.proposalId,
    event.transaction.from,
    event.block,
    event.transaction.hash
  )

  const proposal = Proposal.load(bigIntToBytes(event.params.proposalId))
  if (proposal) {
    proposal.canceled = true
    proposal.cancelBlock = event.block.number
    proposal.cancelTx = event.transaction.hash
    proposal.cancelTime = event.block.timestamp
    proposal.updatedAt = event.block.timestamp
    proposal.save()
  } else {
    log.error("ProposalCanceled event for unknown proposal {}", [event.params.proposalId.toHexString()])
  }
}

export function handleProposalExecuted(event: ProposalExecutedEvent): void {
  saveProposalActivity(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString(),
    'EXECUTE',
    event.params.proposalId,
    event.transaction.from,
    event.block,
    event.transaction.hash
  )

  const proposal = Proposal.load(bigIntToBytes(event.params.proposalId))
  if (proposal) {
    proposal.executed = true
    proposal.updatedAt = event.block.timestamp
    proposal.executeBlock = event.block.number
    proposal.executeTx = event.transaction.hash
    proposal.executeTime = event.block.timestamp
    proposal.save()
  } else {
    log.error("ProposalCanceled event for unknown proposal {}", [event.params.proposalId.toHexString()])
  }
}

export function handleProposalThresholdSet(
  event: ProposalThresholdSetEvent
): void {
  saveGovernorActivity(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString(),
    'ProposalThresholdSet',
    event.transaction.from,
    event.params.oldProposalThreshold,
    event.params.newProposalThreshold,
    event.block,
    event.transaction.hash
  )
}

export function handleQuorumNumeratorUpdated(
  event: QuorumNumeratorUpdatedEvent
): void {
  saveGovernorActivity(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString(),
    'QuorumNumeratorUpdated',
    event.transaction.from,
    event.params.oldQuorumNumerator,
    event.params.newQuorumNumerator,
    event.block,
    event.transaction.hash
  )
}

export function handleVotingDelaySet(event: VotingDelaySetEvent): void {
  saveGovernorActivity(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString(),
    'VotingDelaySet',
    event.transaction.from,
    event.params.oldVotingDelay,
    event.params.newVotingDelay,
    event.block,
    event.transaction.hash
  )
}

export function handleVotingPeriodSet(event: VotingPeriodSetEvent): void {
  saveGovernorActivity(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString(),
    'VotingPeriodSet',
    event.transaction.from,
    event.params.oldVotingPeriod,
    event.params.newVotingPeriod,
    event.block,
    event.transaction.hash
  )
}

export function handleVoteCast(event: VoteCastEvent): void {
  let entity = new VoteCast(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.voter = event.params.voter
  entity.proposalId = event.params.proposalId
  entity.support = event.params.support
  entity.weight = event.params.weight
  entity.reason = event.params.reason
  entity.proposal = bigIntToBytes(event.params.proposalId)
  entity.block = event.block.number
  entity.createdAt = event.block.timestamp
  entity.tx = event.transaction.hash.toHex()
  entity.save()
}

export function handleVoteCastWithParams(event: VoteCastWithParamsEvent): void {
  let entity = new VoteCast(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.voter = event.params.voter
  entity.proposalId = event.params.proposalId
  entity.support = event.params.support
  entity.weight = event.params.weight
  entity.reason = event.params.reason
  entity.params = event.params.params
  entity.proposal = bigIntToBytes(event.params.proposalId)
  entity.block = event.block.number
  entity.createdAt = event.block.timestamp
  entity.tx = event.transaction.hash.toHex()
  entity.save()
}

// Helper: Converts a BigInt to Bytes ensuring the hex string has even length (Graph Bytes.fromHexString requires even length)
function bigIntToBytes(value: BigInt): Bytes {
  let hex = value.toHexString() // e.g. 0xabc
  let content = hex.slice(2)
  if (content.length % 2 == 1) {
    content = '0' + content
  }
  return Bytes.fromHexString('0x' + content)
}
