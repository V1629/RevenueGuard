/**
 * Escalate — Package context for human review and escalate.
 */
class Escalate {
  execute(transaction, diagnosis, reason) {
    return {
      action: 'ESCALATED_TO_HUMAN',
      recovered: false,
      escalated: true,
      amountRecovered: 0,
      reason: reason || `Escalated due to: ${diagnosis.failureReason}`,
      package: {
        transactionId: transaction.id,
        amount: transaction.amount,
        failureReason: diagnosis.failureReason,
        aiReasoning: diagnosis.reasoning,
        recoverabilityScore: diagnosis.recoverabilityScore,
        suggestedAction: 'Manual review required',
        riskFactors: diagnosis.riskFactors || [],
        customerHistory: transaction.customerInfo,
      },
      reasoning: `Transaction escalated to human agent. Reason: ${reason || diagnosis.failureReason}. Full context packaged for review.`,
    };
  }
}

module.exports = new Escalate();
