import { useMemo } from 'react'

const VOTER_KEY = 'torneo_voter_id'
const VOTES_KEY = 'torneo_votes'

function getOrCreateVoterId() {
  let id = localStorage.getItem(VOTER_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(VOTER_KEY, id)
  }
  return id
}

export function useVoter() {
  const voterId = useMemo(() => getOrCreateVoterId(), [])

  function getLocalVotes() {
    try {
      return JSON.parse(localStorage.getItem(VOTES_KEY) || '{}')
    } catch {
      return {}
    }
  }

  function saveLocalVote(matchupId, competitorId) {
    const votes = getLocalVotes()
    votes[matchupId] = competitorId
    localStorage.setItem(VOTES_KEY, JSON.stringify(votes))
  }

  function hasVoted(matchupId) {
    return matchupId in getLocalVotes()
  }

  function getVoteFor(matchupId) {
    return getLocalVotes()[matchupId] ?? null
  }

  return { voterId, saveLocalVote, hasVoted, getVoteFor }
}
