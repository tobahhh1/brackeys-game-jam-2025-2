
const RANK_NAMES = [
    '', 'High card', 'Pair', 'Two pair', 'Three of a kind',
    'Straight', 'Flush', 'Full house', 'Four of a kind', 'Straight flush'
];
const CARD_NAMES = [
    '', 'Ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King'
];

type Card = [number, number]; // [rank, suit]
type Hand = Card[];

enum HandRank {
    HighCard = 1,
    Pair,
    TwoPair,
    ThreeOfAKind,
    Straight,
    Flush,
    FullHouse,
    FourOfAKind,
    StraightFlush,
}

interface EvaluatedHand {
    rank: HandRank;
    tiebreakers: number[]; // descending order for comparison
}

function evaluateHand(hand: Hand): EvaluatedHand {
    const ranks = hand.map(([r]) => r).sort((a, b) => b - a);
    const suits = hand.map(([, s]) => s);
    const rankCounts: Record<number, number> = {};
    for (const r of ranks) rankCounts[r] = (rankCounts[r] || 0) + 1;
    const counts = Object.values(rankCounts).sort((a, b) => b - a);
    const uniqueRanks = Object.keys(rankCounts).map(Number).sort((a, b) => b - a);

    const isFlush = hand.length >= 3 && suits.every(s => s === suits[0]);
    const isStraight = hand.length >= 3 && (
        uniqueRanks.length === hand.length &&
        (uniqueRanks[0] - uniqueRanks[uniqueRanks.length - 1] === hand.length - 1 ||
            // Handle Ace-low straight
            (uniqueRanks.includes(13) && uniqueRanks.includes(1) &&
                uniqueRanks.slice(1).every((r, i) => r === 5 - i)))
    );

    if (hand.length >= 3) {
        if (isStraight && isFlush) return { rank: HandRank.StraightFlush, tiebreakers: [Math.max(...ranks)] };
        if (counts[0] === 4) return { rank: HandRank.FourOfAKind, tiebreakers: [uniqueRanks[0], ...uniqueRanks.slice(1)] };
        if (counts[0] === 3 && counts[1] === 2) return { rank: HandRank.FullHouse, tiebreakers: [uniqueRanks[0], uniqueRanks[1]] };
        if (isFlush) return { rank: HandRank.Flush, tiebreakers: ranks };
        if (isStraight) return { rank: HandRank.Straight, tiebreakers: [Math.max(...ranks)] };
        if (counts[0] === 3) return { rank: HandRank.ThreeOfAKind, tiebreakers: [uniqueRanks[0], ...uniqueRanks.slice(1)] };
        if (counts[0] === 2 && counts[1] === 2) return { rank: HandRank.TwoPair, tiebreakers: [uniqueRanks[0], uniqueRanks[1], ...uniqueRanks.slice(2)] };
        if (counts[0] === 2) return { rank: HandRank.Pair, tiebreakers: [uniqueRanks[0], ...uniqueRanks.slice(1)] };
        return { rank: HandRank.HighCard, tiebreakers: ranks };
    } else {
        if (counts[0] === 3) return { rank: HandRank.ThreeOfAKind, tiebreakers: [uniqueRanks[0], ...uniqueRanks.slice(1)] };
        if (counts[0] === 2) return { rank: HandRank.Pair, tiebreakers: [uniqueRanks[0], ...uniqueRanks.slice(1)] };
        return { rank: HandRank.HighCard, tiebreakers: ranks };
    }
}

function compareHands(handA: Hand, handB: Hand): number {
    const evalA = evaluateHand(handA);
    const evalB = evaluateHand(handB);
    if (evalA.rank !== evalB.rank) return evalA.rank > evalB.rank ? 1 : -1;
    for (let i = 0; i < Math.max(evalA.tiebreakers.length, evalB.tiebreakers.length); i++) {
        const a = evalA.tiebreakers[i] || 0;
        const b = evalB.tiebreakers[i] || 0;
        if (a !== b) return a > b ? 1 : -1;
    }
    return 0; // tie
}

function handDescription(eh: EvaluatedHand): string {
    switch (eh.rank) {
        case HandRank.StraightFlush:
            return `a straight flush with high card ${CARD_NAMES[eh.tiebreakers[0]]}`;
        case HandRank.FourOfAKind:
            return `four of a kind, ${CARD_NAMES[eh.tiebreakers[0]]}s`;
        case HandRank.FullHouse:
            return `a full house, ${CARD_NAMES[eh.tiebreakers[0]]}s over ${CARD_NAMES[eh.tiebreakers[1]]}s`;
        case HandRank.Flush:
            return `a flush with high card ${CARD_NAMES[eh.tiebreakers[0]]}`;
        case HandRank.Straight:
            return `a straight with high card ${CARD_NAMES[eh.tiebreakers[0]]}`;
        case HandRank.ThreeOfAKind:
            return `three of a kind, ${CARD_NAMES[eh.tiebreakers[0]]}s`;
        case HandRank.TwoPair:
            return `two pair, ${CARD_NAMES[eh.tiebreakers[0]]}s and ${CARD_NAMES[eh.tiebreakers[1]]}s`;
        case HandRank.Pair:
            return `a pair of ${CARD_NAMES[eh.tiebreakers[0]]}s`;
        case HandRank.HighCard:
            return `high card ${CARD_NAMES[eh.tiebreakers[0]]}`;
        default:
            return 'unknown hand';
    }
}

function compareHandsWithMessage(handA: Hand, handB: Hand): { result: number, message: string } {
    const evalA = evaluateHand(handA);
    const evalB = evaluateHand(handB);
    let result = 0;
    if (evalA.rank !== evalB.rank) result = evalA.rank > evalB.rank ? 1 : -1;
    else {
        for (let i = 0; i < Math.max(evalA.tiebreakers.length, evalB.tiebreakers.length); i++) {
            const a = evalA.tiebreakers[i] || 0;
            const b = evalB.tiebreakers[i] || 0;
            if (a !== b) {
                result = a > b ? 1 : -1;
                break;
            }
        }
    }
    const descA = handDescription(evalA);
    const descB = handDescription(evalB);
    let message: string;
    if (result === 1) {
        message = `You won with ${descA} against ${descB}.`;
    } else if (result === -1) {
        message = `You lost with ${descA} against ${descB}.`;
    } else {
        message = `It's a tie: both have ${descA}.`;
    }
    return { result, message };
}