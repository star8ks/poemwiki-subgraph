import { BigInt, Bytes } from '@graphprotocol/graph-ts'
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
function saveProposalActivity(id: string, activityType: string, proposalId: BigInt, member: Bytes): void {
  let activity = new ProposalActivity(id)
  activity.proposal = Bytes.fromHexString(proposalId.toHexString())
  activity.activity = activityType
  activity.member = member
  activity.save()
}

// const GovernorSettingActivityType = {
//   ProposalThresholdSet: 'ProposalThresholdSet',
//   QuorumNumeratorUpdated: 'QuorumNumeratorUpdated',
//   VotingDelaySet: 'VotingDelaySet',
//   VotingPeriodSet: 'VotingPeriodSet'
// }
function saveGovernorActivity(id: string, activityType: string, member: Bytes, oldValue: BigInt, newValue: BigInt): void {
  let activity = new GovernorSettingActivity(id)
  activity.activity = activityType
  activity.member = member
  activity.oldValue = oldValue
  activity.newValue = newValue
  activity.save()
}

export function handleProposalCreated(event: ProposalCreatedEvent): void {
  const id = Bytes.fromHexString(event.params.proposalId.toHexString())
  let entity = new Proposal(id)
  entity.proposalId = event.params.proposalId
  entity.proposer = event.params.proposer
  entity.targets = event.params.targets.map<Bytes>(target => Bytes.fromHexString(target.toHexString()))
  entity.values = event.params.values
  entity.signatures = event.params.signatures
  entity.calldatas = event.params.calldatas
  entity.startBlock = event.params.startBlock
  entity.endBlock = event.params.endBlock
  entity.description = event.params.description
  entity.save()

  saveProposalActivity(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString(),
    'CREATE',
    event.params.proposalId,
    event.transaction.from
  )
}

export function handleProposalCanceled(event: ProposalCanceledEvent): void {
  saveProposalActivity(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString(),
    'CANCEL',
    event.params.proposalId,
    event.transaction.from
  )
}

export function handleProposalExecuted(event: ProposalExecutedEvent): void {
  saveProposalActivity(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString(),
    'EXECUTE',
    event.params.proposalId,
    event.transaction.from
  )
}

export function handleProposalThresholdSet(
  event: ProposalThresholdSetEvent
): void {
  saveGovernorActivity(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString(),
    'ProposalThresholdSet',
    event.transaction.from,
    event.params.oldProposalThreshold,
    event.params.newProposalThreshold
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
    event.params.newQuorumNumerator
  )
}

export function handleVotingDelaySet(event: VotingDelaySetEvent): void {
  saveGovernorActivity(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString(),
    'VotingDelaySet',
    event.transaction.from,
    event.params.oldVotingDelay,
    event.params.newVotingDelay
  )
}

export function handleVotingPeriodSet(event: VotingPeriodSetEvent): void {
  saveGovernorActivity(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString(),
    'VotingPeriodSet',
    event.transaction.from,
    event.params.oldVotingPeriod,
    event.params.newVotingPeriod
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
  entity.save()
}
