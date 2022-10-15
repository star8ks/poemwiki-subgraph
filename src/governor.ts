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
  proposalId: BigInt, member: Bytes, block: ethereum.Block): void {
  let activity = new ProposalActivity(id)
  activity.proposal = Bytes.fromHexString(proposalId.toHexString())
  activity.activity = activityType
  activity.member = member
  activity.block = block.number
  activity.createdAt = block.timestamp
  activity.save()
}

// const GovernorSettingActivityType = {
//   ProposalThresholdSet: 'ProposalThresholdSet',
//   QuorumNumeratorUpdated: 'QuorumNumeratorUpdated',
//   VotingDelaySet: 'VotingDelaySet',
//   VotingPeriodSet: 'VotingPeriodSet'
// }
function saveGovernorActivity(id: string, activityType: string, member: Bytes,
  oldValue: BigInt, newValue: BigInt, block: ethereum.Block): void {
  let activity = new GovernorSettingActivity(id)
  activity.activity = activityType
  activity.member = member
  activity.oldValue = oldValue
  activity.newValue = newValue
  activity.block = block.number
  activity.createdAt = block.timestamp
  activity.save()
}

export function handleProposalCreated(event: ProposalCreatedEvent): void {
  const id = Bytes.fromHexString(event.params.proposalId.toHexString())
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
    event.block
  )
}

export function handleProposalCanceled(event: ProposalCanceledEvent): void {
  saveProposalActivity(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString(),
    'CANCEL',
    event.params.proposalId,
    event.transaction.from,
    event.block
  )

  const proposal = Proposal.load(Bytes.fromHexString(event.params.proposalId.toHexString()))
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
    event.block
  )

  const proposal = Proposal.load(Bytes.fromHexString(event.params.proposalId.toHexString()))
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
    event.block
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
    event.block
  )
}

export function handleVotingDelaySet(event: VotingDelaySetEvent): void {
  saveGovernorActivity(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString(),
    'VotingDelaySet',
    event.transaction.from,
    event.params.oldVotingDelay,
    event.params.newVotingDelay,
    event.block
  )
}

export function handleVotingPeriodSet(event: VotingPeriodSetEvent): void {
  saveGovernorActivity(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString(),
    'VotingPeriodSet',
    event.transaction.from,
    event.params.oldVotingPeriod,
    event.params.newVotingPeriod,
    event.block
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
  entity.proposal = Bytes.fromHexString(event.params.proposalId.toHexString())
  entity.block = event.block.number
  entity.createdAt = event.block.timestamp
  entity.voteTx = event.transaction.hash
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
  entity.proposal = Bytes.fromHexString(event.params.proposalId.toHexString())
  entity.block = event.block.number
  entity.createdAt = event.block.timestamp
  entity.voteTx = event.transaction.hash
  entity.save()
}
