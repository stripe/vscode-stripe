export interface Pattern {
  regexps: RegExpMap;
  url: string;
}

export interface RegExpMap {
  [index: string]: string;
}

// TODO: future autogen for this is possible with a couple of scripts
// TODO: nest each language's regex underneath a language key and rename this file
// eg. regexp.javascript = /balance\.retrieve, regexp.golang = /balance\.Get
// .NET is unlikely to be supported due to the service pattern, but we can link each service type to the correct API ref top section
export const stripeMethodList: Pattern[] = [
  {
    "url": "/balance/balance_retrieve",
    "regexps": {
      "javascript": "balance\\.retrieve"
    }
  },
  {
    "url": "/balance_transactions/retrieve",
    "regexps": {
      "javascript": "balanceTransactions\\.retrieve"
    }
  },
  {
    "url": "/balance_transactions/list",
    "regexps": {
      "javascript": "balanceTransactions\\.list"
    }
  },
  {
    "url": "/charges/retrieve",
    "regexps": {
      "javascript": "charges\\.retrieve"
    }
  },
  {
    "url": "/charges/update",
    "regexps": {
      "javascript": "charges\\.update"
    }
  },
  {
    "url": "/charges/capture",
    "regexps": {
      "javascript": "charges\\.capture"
    }
  },
  {
    "url": "/charges/create",
    "regexps": {
      "javascript": "charges\\.create"
    }
  },
  {
    "url": "/charges/list",
    "regexps": {
      "javascript": "charges\\.list"
    }
  },
  {
    "url": "/customers/retrieve",
    "regexps": {
      "javascript": "customers\\.retrieve"
    }
  },
  {
    "url": "/customers/update",
    "regexps": {
      "javascript": "customers\\.update"
    }
  },
  {
    "url": "/customers/delete",
    "regexps": {
      "javascript": "customers\\.del"
    }
  },
  {
    "url": "/customers/create",
    "regexps": {
      "javascript": "customers\\.create"
    }
  },
  {
    "url": "/customers/list",
    "regexps": {
      "javascript": "customers\\.list"
    }
  },
  {
    "url": "/disputes/retrieve",
    "regexps": {
      "javascript": "disputes\\.retrieve"
    }
  },
  {
    "url": "/disputes/update",
    "regexps": {
      "javascript": "disputes\\.update"
    }
  },
  {
    "url": "/disputes/close",
    "regexps": {
      "javascript": "disputes\\.close"
    }
  },
  {
    "url": "/disputes/list",
    "regexps": {
      "javascript": "disputes\\.list"
    }
  },
  {
    "url": "/events/retrieve",
    "regexps": {
      "javascript": "events\\.retrieve"
    }
  },
  {
    "url": "/events/list",
    "regexps": {
      "javascript": "events\\.list"
    }
  },
  {
    "url": "/files/create",
    "regexps": {
      "javascript": "files\\.create"
    }
  },
  {
    "url": "/files/list",
    "regexps": {
      "javascript": "files\\.list"
    }
  },
  {
    "url": "/files/retrieve",
    "regexps": {
      "javascript": "files\\.retrieve"
    }
  },
  {
    "url": "/file_links/create",
    "regexps": {
      "javascript": "fileLinks\\.create"
    }
  },
  {
    "url": "/file_links/list",
    "regexps": {
      "javascript": "fileLinks\\.list"
    }
  },
  {
    "url": "/file_links/update",
    "regexps": {
      "javascript": "fileLinks\\.update"
    }
  },
  {
    "url": "/file_links/retrieve",
    "regexps": {
      "javascript": "fileLinks\\.retrieve"
    }
  },
  {
    "url": "/mandates/retrieve",
    "regexps": {
      "javascript": "mandates\\.retrieve"
    }
  },
  {
    "url": "/payment_intents/retrieve",
    "regexps": {
      "javascript": "paymentIntents\\.retrieve"
    }
  },
  {
    "url": "/payment_intents/update",
    "regexps": {
      "javascript": "paymentIntents\\.update"
    }
  },
  {
    "url": "/payment_intents/capture",
    "regexps": {
      "javascript": "paymentIntents\\.capture"
    }
  },
  {
    "url": "/payment_intents/confirm",
    "regexps": {
      "javascript": "paymentIntents\\.confirm"
    }
  },
  {
    "url": "/payment_intents/create",
    "regexps": {
      "javascript": "paymentIntents\\.create"
    }
  },
  {
    "url": "/payment_intents/list",
    "regexps": {
      "javascript": "paymentIntents\\.list"
    }
  },
  {
    "url": "/setup_intents/retrieve",
    "regexps": {
      "javascript": "setupIntents\\.retrieve"
    }
  },
  {
    "url": "/setup_intents/update",
    "regexps": {
      "javascript": "setupIntents\\.update"
    }
  },
  {
    "url": "/setup_intents/confirm",
    "regexps": {
      "javascript": "setupIntents\\.confirm"
    }
  },
  {
    "url": "/setup_intents/create",
    "regexps": {
      "javascript": "setupIntents\\.create"
    }
  },
  {
    "url": "/setup_intents/list",
    "regexps": {
      "javascript": "setupIntents\\.list"
    }
  },
  {
    "url": "/payouts/retrieve",
    "regexps": {
      "javascript": "payouts\\.retrieve"
    }
  },
  {
    "url": "/payouts/update",
    "regexps": {
      "javascript": "payouts\\.update"
    }
  },
  {
    "url": "/payouts/cancel",
    "regexps": {
      "javascript": "payouts\\.cancel"
    }
  },
  {
    "url": "/payouts/create",
    "regexps": {
      "javascript": "payouts\\.create"
    }
  },
  {
    "url": "/payouts/list",
    "regexps": {
      "javascript": "payouts\\.list"
    }
  },
  {
    "url": "/products/retrieve",
    "regexps": {
      "javascript": "products\\.retrieve"
    }
  },
  {
    "url": "/products/update",
    "regexps": {
      "javascript": "products\\.update"
    }
  },
  {
    "url": "/products/delete",
    "regexps": {
      "javascript": "products\\.del"
    }
  },
  {
    "url": "/products/create",
    "regexps": {
      "javascript": "products\\.create"
    }
  },
  {
    "url": "/products/list",
    "regexps": {
      "javascript": "products\\.list"
    }
  },
  {
    "url": "/refunds/retrieve",
    "regexps": {
      "javascript": "refunds\\.retrieve"
    }
  },
  {
    "url": "/refunds/update",
    "regexps": {
      "javascript": "refunds\\.update"
    }
  },
  {
    "url": "/refunds/create",
    "regexps": {
      "javascript": "refunds\\.create"
    }
  },
  {
    "url": "/refunds/list",
    "regexps": {
      "javascript": "refunds\\.list"
    }
  },
  {
    "url": "/tokens/object",
    "regexps": {
      "javascript": "tokens\\.create"
    }
  },
  {
    "url": "/payment_methods/retrieve",
    "regexps": {
      "javascript": "paymentMethods\\.retrieve"
    }
  },
  {
    "url": "/payment_methods/update",
    "regexps": {
      "javascript": "paymentMethods\\.update"
    }
  },
  {
    "url": "/payment_methods/create",
    "regexps": {
      "javascript": "paymentMethods\\.create"
    }
  },
  {
    "url": "/payment_methods/list",
    "regexps": {
      "javascript": "paymentMethods\\.list"
    }
  },
  {
    "url": "/payment_methods/attach",
    "regexps": {
      "javascript": "paymentMethods\\.attach"
    }
  },
  {
    "url": "/payment_methods/detach",
    "regexps": {
      "javascript": "paymentMethods\\.detach"
    }
  },
  {
    "url": "/sources/retrieve",
    "regexps": {
      "javascript": "sources\\.retrieve"
    }
  },
  {
    "url": "/sources/update",
    "regexps": {
      "javascript": "sources\\.update"
    }
  },
  {
    "url": "/sources/create",
    "regexps": {
      "javascript": "sources\\.create"
    }
  },
  {
    "url": "/sources/attach",
    "regexps": {
      "javascript": "sources\\.attach"
    }
  },
  {
    "url": "/sources/detach",
    "regexps": {
      "javascript": "sources\\.detach"
    }
  },
  {
    "url": "/checkout/sessions/retrieve",
    "regexps": {
      "javascript": "checkout\\.sessions\\.retrieve"
    }
  },
  {
    "url": "/checkout/sessions/list",
    "regexps": {
      "javascript": "checkout\\.sessions\\.list"
    }
  },
  {
    "url": "/checkout/sessions/create",
    "regexps": {
      "javascript": "checkout\\.sessions\\.create"
    }
  },
  {
    "url": "/coupons/retrieve",
    "regexps": {
      "javascript": "coupons\\.retrieve"
    }
  },
  {
    "url": "/coupons/update",
    "regexps": {
      "javascript": "coupons\\.update"
    }
  },
  {
    "url": "/coupons/create",
    "regexps": {
      "javascript": "coupons\\.create"
    }
  },
  {
    "url": "/coupons/delete",
    "regexps": {
      "javascript": "coupons\\.del"
    }
  },
  {
    "url": "/coupons/list",
    "regexps": {
      "javascript": "creditNotes\\.list"
    }
  },
  {
    "url": "/credit_notes/retrieve",
    "regexps": {
      "javascript": "creditNotes\\.retrieve"
    }
  },
  {
    "url": "/credit_notes/update",
    "regexps": {
      "javascript": "creditNotes\\.update"
    }
  },
  {
    "url": "/credit_notes/create",
    "regexps": {
      "javascript": "creditNotes\\.create"
    }
  },
  {
    "url": "/credit_notes/delete",
    "regexps": {
      "javascript": "creditNotes\\.del"
    }
  },
  {
    "url": "/credit_notes/list",
    "regexps": {
      "javascript": "creditNotes\\.list"
    }
  },
  {
    "url": "/credit_notes/void",
    "regexps": {
      "javascript": "creditNotes\\.void"
    }
  },
  {
    "url": "/credit_notes/preview_lines",
    "regexps": {
      "javascript": "creditNoteLineItems\\.retrieve"
    }
  },
  {
    "url": "/customer_balance_transactions/update",
    "regexps": {
      "javascript": "customers\\.updateBalanceTransaction"
    }
  },
  {
    "url": "/customer_balance_transactions/create",
    "regexps": {
      "javascript": "customers\\.createBalanceTransaction"
    }
  },
  {
    "url": "/customer_balance_transactions/retrieve",
    "regexps": {
      "javascript": "customers\\.retrieveBalanceTransaction"
    }
  },
  {
    "url": "/customer_balance_transactions/list",
    "regexps": {
      "javascript": "customers\\.listBalanceTransactions"
    }
  },
  {
    "url": "/customer_tax_ids/update",
    "regexps": {
      "javascript": "customers\\.updateTaxId"
    }
  },
  {
    "url": "/customer_tax_ids/create",
    "regexps": {
      "javascript": "customers\\.createTaxId"
    }
  },
  {
    "url": "/customer_tax_ids/retrieve",
    "regexps": {
      "javascript": "customers\\.retrieveTaxId"
    }
  },
  {
    "url": "/discounts/delete",
    "regexps": {
      "javascript": "customers\\.deleteDiscount"
    }
  },
  {
    "url": "/discounts/subscription_delete",
    "regexps": {
      "javascript": "subscriptions\\.deleteDiscount"
    }
  },
  {
    "url": "/invoices/retrieve",
    "regexps": {
      "javascript": "invoices\\.retrieve"
    }
  },
  {
    "url": "/invoices/update",
    "regexps": {
      "javascript": "invoices\\.update"
    }
  },
  {
    "url": "/invoices/create",
    "regexps": {
      "javascript": "invoices\\.create"
    }
  },
  {
    "url": "/invoices/list",
    "regexps": {
      "javascript": "invoices\\.list"
    }
  },
  {
    "url": "/invoices/delete",
    "regexps": {
      "javascript": "invoices\\.del"
    }
  },
  {
    "url": "/invoices/finalize",
    "regexps": {
      "javascript": "invoices\\.finalizeInvoice"
    }
  },
  {
    "url": "/invoices/pay",
    "regexps": {
      "javascript": "invoices\\.pay"
    }
  },
  {
    "url": "/invoices/send",
    "regexps": {
      "javascript": "invoices\\.sendInvoice"
    }
  },
  {
    "url": "/invoices/void",
    "regexps": {
      "javascript": "invoices\\.voidInvoice"
    }
  },
  {
    "url": "/invoices/mark_uncollectable",
    "regexps": {
      "javascript": "invoices\\.markUncollectable"
    }
  },
  {
    "url": "/invoices/invoice_lines",
    "regexps": {
      "javascript": "invoices\\.listLineItems"
    }
  },
  {
    "url": "/invoices/upcoming",
    "regexps": {
      "javascript": "invoices\\.retrieveUpcoming"
    }
  },
  {
    "url": "/invoices/upcoming_invoice_lines",
    "regexps": {
      "javascript": "invoices\\.listUpcomingLineItems"
    }
  },
  {
    "url": "/invoiceitems/retrieve",
    "regexps": {
      "javascript": "invoiceItems\\.retrieve"
    }
  },
  {
    "url": "/invoiceitems/update",
    "regexps": {
      "javascript": "invoiceItems\\.update"
    }
  },
  {
    "url": "/invoiceitems/create",
    "regexps": {
      "javascript": "invoiceItems\\.create"
    }
  },
  {
    "url": "/invoiceitems/list",
    "regexps": {
      "javascript": "invoiceItems\\.list"
    }
  },
  {
    "url": "/invoiceitems/delete",
    "regexps": {
      "javascript": "invoiceItems\\.del"
    }
  },
  {
    "url": "/plans/retrieve",
    "regexps": {
      "javascript": "plans\\.retrieve"
    }
  },
  {
    "url": "/plans/update",
    "regexps": {
      "javascript": "plans\\.update"
    }
  },
  {
    "url": "/plans/create",
    "regexps": {
      "javascript": "plans\\.create"
    }
  },
  {
    "url": "/plans/list",
    "regexps": {
      "javascript": "plans\\.list"
    }
  },
  {
    "url": "/plans/delete",
    "regexps": {
      "javascript": "plans\\.del"
    }
  },
  {
    "url": "/products/retrieve",
    "regexps": {
      "javascript": "products\\.retrieve"
    }
  },
  {
    "url": "/products/update",
    "regexps": {
      "javascript": "products\\.update"
    }
  },
  {
    "url": "/products/create",
    "regexps": {
      "javascript": "products\\.create"
    }
  },
  {
    "url": "/products/list",
    "regexps": {
      "javascript": "products\\.list"
    }
  },
  {
    "url": "/products/delete",
    "regexps": {
      "javascript": "products\\.del"
    }
  },
  {
    "url": "/subscriptions/retrieve",
    "regexps": {
      "javascript": "subscriptions\\.retrieve"
    }
  },
  {
    "url": "/subscriptions/update",
    "regexps": {
      "javascript": "subscriptions\\.update"
    }
  },
  {
    "url": "/subscriptions/create",
    "regexps": {
      "javascript": "subscriptions\\.create"
    }
  },
  {
    "url": "/subscriptions/list",
    "regexps": {
      "javascript": "subscriptions\\.list"
    }
  },
  {
    "url": "/subscriptions/cancel",
    "regexps": {
      "javascript": "subscriptions\\.cancel"
    }
  },
  {
    "url": "/subscription_items/retrieve",
    "regexps": {
      "javascript": "subscriptionItems\\.retrieve"
    }
  },
  {
    "url": "/subscription_items/update",
    "regexps": {
      "javascript": "subscriptionItems\\.update"
    }
  },
  {
    "url": "/subscription_items/create",
    "regexps": {
      "javascript": "subscriptionItems\\.create"
    }
  },
  {
    "url": "/subscription_items/list",
    "regexps": {
      "javascript": "subscriptionItems\\.list"
    }
  },
  {
    "url": "/subscription_items/delete",
    "regexps": {
      "javascript": "subscriptionItems\\.del"
    }
  },
  {
    "url": "/usage_records/subscription_item_summary",
    "regexps": {
      "javascript": "subscriptionItems\\.listUsageRecordSummaries"
    }
  },
  {
    "url": "/usage_records/create",
    "regexps": {
      "javascript": "subscriptionItems\\.createUsageRecord"
    }
  },
  {
    "url": "/subscription_schedules/retrieve",
    "regexps": {
      "javascript": "subscriptionSchedules\\.retrieve"
    }
  },
  {
    "url": "/subscription_schedules/update",
    "regexps": {
      "javascript": "subscriptionSchedules\\.update"
    }
  },
  {
    "url": "/subscription_schedules/create",
    "regexps": {
      "javascript": "subscriptionSchedules\\.create"
    }
  },
  {
    "url": "/subscription_schedules/list",
    "regexps": {
      "javascript": "subscriptionSchedules\\.list"
    }
  },
  {
    "url": "/subscription_schedules/cancel",
    "regexps": {
      "javascript": "subscriptionSchedules\\.cancel"
    }
  },
  {
    "url": "/subscription_schedules/release",
    "regexps": {
      "javascript": "subscriptionSchedules\\.release"
    }
  },
  {
    "url": "/tax_rates/retrieve",
    "regexps": {
      "javascript": "taxRates\\.retrieve"
    }
  },
  {
    "url": "/tax_rates/update",
    "regexps": {
      "javascript": "taxRates\\.update"
    }
  },
  {
    "url": "/tax_rates/create",
    "regexps": {
      "javascript": "taxRates\\.create"
    }
  },
  {
    "url": "/tax_rates/list",
    "regexps": {
      "javascript": "taxRates\\.list"
    }
  },
  {
    "url": "/accounts/retrieve",
    "regexps": {
      "javascript": "accounts\\.retrieve"
    }
  },
  {
    "url": "/accounts/update",
    "regexps": {
      "javascript": "accounts\\.update"
    }
  },
  {
    "url": "/accounts/create",
    "regexps": {
      "javascript": "accounts\\.create"
    }
  },
  {
    "url": "/accounts/list",
    "regexps": {
      "javascript": "accounts\\.list"
    }
  },
  {
    "url": "/accounts/reject",
    "regexps": {
      "javascript": "accounts\\.reject"
    }
  },
  {
    "url": "/accounts/delete",
    "regexps": {
      "javascript": "accounts\\.del"
    }
  },
  {
    "url": "/accounts/login_link",
    "regexps": {
      "javascript": "accounts\\.createLoginLink"
    }
  },
  {
    "url": "/account_links/create",
    "regexps": {
      "javascript": "accountLinks\\.create"
    }
  },
  {
    "url": "/application_fees/retrieve",
    "regexps": {
      "javascript": "applicationFees\\.retrieve"
    }
  },
  {
    "url": "/application_fees/create",
    "regexps": {
      "javascript": "applicationFees\\.create"
    }
  },
  {
    "url": "/application_fees/list",
    "regexps": {
      "javascript": "applicationFees\\.list"
    }
  },
  {
    "url": "fee_refunds/retrieve",
    "regexps": {
      "javascript": "applicationFees\\.retrieveRefund"
    }
  },
  {
    "url": "fee_refunds/update",
    "regexps": {
      "javascript": "applicationFees\\.updateRefund"
    }
  },
  {
    "url": "fee_refunds/create",
    "regexps": {
      "javascript": "applicationFees\\.createRefund"
    }
  },
  {
    "url": "fee_refunds/list",
    "regexps": {
      "javascript": "applicationFees\\.listRefunds"
    }
  },
  {
    "url": "/capabilities/retrieve",
    "regexps": {
      "javascript": "accounts\\.retrieveCapability"
    }
  },
  {
    "url": "/capabilities/update",
    "regexps": {
      "javascript": "accounts\\.updateCapability"
    }
  },
  {
    "url": "/capabilities/list",
    "regexps": {
      "javascript": "accounts\\.listCapabilities"
    }
  },
  {
    "url": "/country_specs/retrieve",
    "regexps": {
      "javascript": "countrySpecs\\.retrieve"
    }
  },
  {
    "url": "/country_specs/list",
    "regexps": {
      "javascript": "countrySpecs\\.list"
    }
  },
  // these external accounts can't be linked to the specific methods due to ambiguous card / bank account option params
  // TODO: more advanced regex / ast walking would help improve this experience
  {
    "url": "/external_bank_accounts",
    "regexps": {
      "javascript": "accounts\\.retrieveExternalAccount"
    }
  },
  {
    "url": "/external_bank_accounts",
    "regexps": {
      "javascript": "accounts\\.updateExternalAccount"
    }
  },
  {
    "url": "/external_bank_accounts",
    "regexps": {
      "javascript": "accounts\\.createExternalAccount"
    }
  },
  {
    "url": "/external_bank_accounts",
    "regexps": {
      "javascript": "accounts\\.listExternalAccounts"
    }
  },
  {
    "url": "/person/retrieve",
    "regexps": {
      "javascript": "accounts\\.retrievePerson"
    }
  },
  {
    "url": "/person/update",
    "regexps": {
      "javascript": "accounts\\.updatePerson"
    }
  },
  {
    "url": "/person/create",
    "regexps": {
      "javascript": "accounts\\.createPerson"
    }
  },
  {
    "url": "/person/list",
    "regexps": {
      "javascript": "accounts\\.listPersons"
    }
  },
  {
    "url": "/topups/retrieve",
    "regexps": {
      "javascript": "topups\\.retrieve"
    }
  },
  {
    "url": "/topups/update",
    "regexps": {
      "javascript": "topups\\.update"
    }
  },
  {
    "url": "/topups/create",
    "regexps": {
      "javascript": "topups\\.create"
    }
  },
  {
    "url": "/topups/cancel",
    "regexps": {
      "javascript": "topups\\.cancel"
    }
  },
  {
    "url": "/topups/list",
    "regexps": {
      "javascript": "topups\\.list"
    }
  },
  {
    "url": "/transfers/retrieve",
    "regexps": {
      "javascript": "transfers\\.retrieve"
    }
  },
  {
    "url": "/transfers/update",
    "regexps": {
      "javascript": "transfers\\.update"
    }
  },
  {
    "url": "/transfers/create",
    "regexps": {
      "javascript": "transfers\\.create"
    }
  },
  {
    "url": "/transfers/cancel",
    "regexps": {
      "javascript": "transfers\\.cancel"
    }
  },
  {
    "url": "/transfers/list",
    "regexps": {
      "javascript": "transfers\\.list"
    }
  },
  {
    "url": "/transfer_reversals/retrieve",
    "regexps": {
      "javascript": "transfers\\.retrieveReversal"
    }
  },
  {
    "url": "/transfer_reversals/update",
    "regexps": {
      "javascript": "transfers\\.updateReversal"
    }
  },
  {
    "url": "/transfer_reversals/create",
    "regexps": {
      "javascript": "transfers\\.createReversal"
    }
  },
  {
    "url": "/transfer_reversals/list",
    "regexps": {
      "javascript": "transfers\\.listReversals"
    }
  },
  {
    "url": "/radar/early_fraud_warnings/retrieve",
    "regexps": {
      "javascript": "radar\\.earlyFraudWarnings\\.retrieve"
    }
  },
  {
    "url": "/radar/early_fraud_warnings/list",
    "regexps": {
      "javascript": "radar\\.earlyFraudWarnings\\.list"
    }
  },
  {
    "url": "/radar/reviews/retrieve",
    "regexps": {
      "javascript": "reviews\\.retrieve"
    }
  },
  {
    "url": "/radar/reviews/list",
    "regexps": {
      "javascript": "reviews\\.list"
    }
  },
  {
    "url": "/radar/reviews/approve",
    "regexps": {
      "javascript": "reviews\\.approve"
    }
  },
  {
    "url": "/radar/value_lists/retrieve",
    "regexps": {
      "javascript": "radar\\.valuesLists\\.retrieve"
    }
  },
  {
    "url": "/radar/value_lists/create",
    "regexps": {
      "javascript": "radar\\.valuesLists\\.create"
    }
  },
  {
    "url": "/radar/value_lists/update",
    "regexps": {
      "javascript": "radar\\.valuesLists\\.update"
    }
  },
  {
    "url": "/radar/value_lists/delete",
    "regexps": {
      "javascript": "radar\\.valuesLists\\.del"
    }
  },
  {
    "url": "/radar/value_lists/list",
    "regexps": {
      "javascript": "radar\\.valuesLists\\.list"
    }
  },
  {
    "url": "/issuing/authorizations/retrieve",
    "regexps": {
      "javascript": "issuing\\.authorizations\\.retrieve"
    }
  },
  {
    "url": "/issuing/authorizations/approve",
    "regexps": {
      "javascript": "issuing\\.authorizations\\.approve"
    }
  },
  {
    "url": "/issuing/authorizations/update",
    "regexps": {
      "javascript": "issuing\\.authorizations\\.update"
    }
  },
  {
    "url": "/issuing/authorizations/decline",
    "regexps": {
      "javascript": "issuing\\.authorizations\\.decline"
    }
  },
  {
    "url": "/issuing/authorizations/list",
    "regexps": {
      "javascript": "issuing\\.authorizations\\.list"
    }
  },
  {
    "url": "/issuing/cardholders/retrieve",
    "regexps": {
      "javascript": "issuing\\.cardholders\\.retrieve"
    }
  },
  {
    "url": "/issuing/cardholders/create",
    "regexps": {
      "javascript": "issuing\\.cardholders\\.create"
    }
  },
  {
    "url": "/issuing/cardholders/update",
    "regexps": {
      "javascript": "issuing\\.cardholders\\.update"
    }
  },
  {
    "url": "/issuing/cardholders/list",
    "regexps": {
      "javascript": "issuing\\.cardholders\\.list"
    }
  },
  {
    "url": "/issuing/cards/retrieve",
    "regexps": {
      "javascript": "issuing\\.cards\\.retrieve"
    }
  },
  {
    "url": "/issuing/cards/create",
    "regexps": {
      "javascript": "issuing\\.cards\\.create"
    }
  },
  {
    "url": "/issuing/cards/update",
    "regexps": {
      "javascript": "issuing\\.cards\\.update"
    }
  },
  {
    "url": "/issuing/cards/list",
    "regexps": {
      "javascript": "issuing\\.cards\\.list"
    }
  },
  {
    "url": "/issuing/transactions/retrieve",
    "regexps": {
      "javascript": "issuing\\.transactions\\.retrieve"
    }
  },
  {
    "url": "/issuing/transactions/update",
    "regexps": {
      "javascript": "issuing\\.transactions\\.update"
    }
  },
  {
    "url": "/issuing/transactions/list",
    "regexps": {
      "javascript": "issuing\\.transactions\\.list"
    }
  },
  {
    "url": "/terminal/locations/create",
    "regexps": {
      "javascript": "terminal\\.locations\\.create"
    }
  },
  {
    "url": "/terminal/locations/retrieve",
    "regexps": {
      "javascript": "terminal\\.locations\\.retrieve"
    }
  },
  {
    "url": "/terminal/locations/update",
    "regexps": {
      "javascript": "terminal\\.locations\\.update"
    }
  },
  {
    "url": "/terminal/locations/delete",
    "regexps": {
      "javascript": "terminal\\.locations\\.del"
    }
  },
  {
    "url": "/terminal/locations/list",
    "regexps": {
      "javascript": "terminal\\.locations\\.list"
    }
  },
  {
    "url": "/terminal/connection_tokens/create",
    "regexps": {
      "javascript": "terminal\\.connectionTokens\\.create"
    }
  },
  {
    "url": "/terminal/readers/create",
    "regexps": {
      "javascript": "terminal\\.readers\\.create"
    }
  },
  {
    "url": "/terminal/readers/retrieve",
    "regexps": {
      "javascript": "terminal\\.readers\\.retrieve"
    }
  },
  {
    "url": "/terminal/readers/update",
    "regexps": {
      "javascript": "terminal\\.readers\\.update"
    }
  },
  {
    "url": "/terminal/readers/delete",
    "regexps": {
      "javascript": "terminal\\.readers\\.del"
    }
  },
  {
    "url": "/terminal/readers/list",
    "regexps": {
      "javascript": "terminal\\.readers\\.list"
    }
  },
  {
    "url": "/orders/retrieve",
    "regexps": {
      "javascript": "orders\\.retrieve"
    }
  },
  {
    "url": "/orders/update",
    "regexps": {
      "javascript": "orders\\.update"
    }
  },
  {
    "url": "/orders/create",
    "regexps": {
      "javascript": "orders\\.create"
    }
  },
  {
    "url": "/orders/return",
    "regexps": {
      "javascript": "orders\\.return"
    }
  },
  {
    "url": "/orders/pay",
    "regexps": {
      "javascript": "orders\\.pay"
    }
  },
  {
    "url": "/orders/list",
    "regexps": {
      "javascript": "orders\\.list"
    }
  },
  {
    "url": "/order_returns/retrieve",
    "regexps": {
      "javascript": "ordersReturns\\.retrieve"
    }
  },
  {
    "url": "/order_returns/list",
    "regexps": {
      "javascript": "ordersReturns\\.list"
    }
  },
  {
    "url": "/skus/retrieve",
    "regexps": {
      "javascript": "skus\\.retrieve"
    }
  },
  {
    "url": "/skus/update",
    "regexps": {
      "javascript": "skus\\.update"
    }
  },
  {
    "url": "/skus/create",
    "regexps": {
      "javascript": "skus\\.create"
    }
  },
  {
    "url": "/skus/delete",
    "regexps": {
      "javascript": "skus\\.del"
    }
  },
  {
    "url": "/skus/list",
    "regexps": {
      "javascript": "skus\\.list"
    }
  },
  {
    "url": "/sigma/scheduled_queries/retrieve",
    "regexps": {
      "javascript": "sigma\\.scheduledQueryRuns\\.retrieve"
    }
  },
  {
    "url": "/sigma/scheduled_queries/list",
    "regexps": {
      "javascript": "sigma\\.scheduledQueryRuns\\.list"
    }
  },
  {
    "url": "/reporting/report_run/create",
    "regexps": {
      "javascript": "reporting\\.reportRuns\\.create"
    }
  },
  {
    "url": "/reporting/report_run/retrieve",
    "regexps": {
      "javascript": "reporting\\.reportRuns\\.retrieve"
    }
  },
  {
    "url": "/reporting/report_run/list",
    "regexps": {
      "javascript": "reporting\\.reportRuns\\.list"
    }
  },
  {
    "url": "/reporting/report_type/retrieve",
    "regexps": {
      "javascript": "reporting\\.reportType\\.retrieve"
    }
  },
  {
    "url": "/reporting/report_type/list",
    "regexps": {
      "javascript": "reporting\\.reportType\\.list"
    }
  }
]