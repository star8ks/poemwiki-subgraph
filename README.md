# PoemWiki Subgraph

PoemWiki DAO reputation token and governor subgraph.

## Project Overview

- **PoemWiki DAO**: This project involves a subgraph for the PoemWiki DAO, which includes a reputation token and a governor.
- **Network**: The subgraph is deployed on the Goerli test network.

## Initialize and Deploy
pnpm add -g @graphprotocol/graph-cli
graph auth xxxxxxxxxxx
graph build
graph deploy subgraph-name

## Key Components

- **Entities**: 
  - `Transfer`: Represents token transfers.
  - `Member`: Represents members with balances and delegates.
  - `Proposal`: Represents governance proposals.
  - `VoteCast`: Represents votes cast on proposals.
  - `ProposalActivity`: Tracks activities related to proposals.
  - `GovernorSettingActivity`: Tracks changes in governor settings.

- **Data Sources**:
  - **PoemWikiToken**: Handles events related to token transfers and delegate changes.
  - **Governor**: Handles events related to proposal creation, execution, and voting.

## Configuration

- **Schema**: Defined in `schema.graphql`.
- **Mappings**: Defined in `subgraph.yaml`, using AssemblyScript for event handling.

## Event Handlers

- **PoemWikiToken**:
  - `handleDelegateChanged`
  - `handleDelegateVotesChanged`
  - `handleTransfer`

- **Governor**:
  - `handleProposalCanceled`
  - `handleProposalCreated`
  - `handleProposalExecuted`
  - `handleProposalThresholdSet`
  - `handleQuorumNumeratorUpdated`
  - `handleVoteCast`
  - `handleVoteCastWithParams`
  - `handleVotingDelaySet`
  - `handleVotingPeriodSet`

