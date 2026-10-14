import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

function getCloudflareHeaders() {
  const email = process.env.CLOUDFLARE_AUTH_EMAIL;
  const key = process.env.CLOUDFLARE_GLOBAL_KEY;
  const token = process.env.CLOUDFLARE_API_TOKEN;

  if (token) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  if (email && key) {
    return {
      'X-Auth-Email': email,
      'X-Auth-Key': key,
      'Content-Type': 'application/json'
    };
  }

  return null;
}

export function isCloudflareConfigured() {
  const headers = getCloudflareHeaders();
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  return Boolean(headers && accountId && zoneId);
}

/**
 * Fetch current email routing rules and destination addresses from Cloudflare
 */
export async function getEmailRoutingInfo() {
  if (!isCloudflareConfigured()) {
    return {
      isConfigured: false,
      message: 'Cloudflare credentials (EMAIL, KEY/TOKEN, ACCOUNT_ID, ZONE_ID) not configured in .env'
    };
  }

  const headers = getCloudflareHeaders();
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@icaregadget.store';

  try {
    const [addrRes, rulesRes] = await Promise.all([
      fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/email/routing/addresses`, { headers }),
      fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/email/routing/rules`, { headers })
    ]);

    const addrData = await addrRes.json();
    const rulesData = await rulesRes.json();

    if (!addrData.success || !rulesData.success) {
      const err = (addrData.errors?.[0]?.message) || (rulesData.errors?.[0]?.message) || 'Cloudflare API error';
      throw new Error(err);
    }

    const addresses = (addrData.result || []).map(a => ({
      tag: a.tag || a.id,
      email: a.email,
      verified: a.verified,
      created: a.created
    }));

    // Find rule for adminEmail
    const rules = rulesData.result || [];
    const adminRule = rules.find(r => 
      r.matchers?.some(m => m.type === 'literal' && m.field === 'to' && m.value?.toLowerCase() === adminEmail.toLowerCase())
    );

    let currentForwardTo = null;
    let ruleId = null;
    let ruleEnabled = false;

    if (adminRule) {
      ruleId = adminRule.id || adminRule.tag;
      ruleEnabled = adminRule.enabled;
      const forwardAction = adminRule.actions?.find(a => a.type === 'forward');
      if (forwardAction && forwardAction.value && forwardAction.value.length > 0) {
        currentForwardTo = forwardAction.value[0];
      }
    }

    return {
      isConfigured: true,
      adminEmail,
      currentForwardTo,
      ruleId,
      ruleEnabled,
      addresses
    };
  } catch (err) {
    console.error('Error fetching Cloudflare Email Routing info:', err);
    throw err;
  }
}

/**
 * Add a new destination email address in Cloudflare (triggers verification link)
 */
export async function addDestinationAddress(destinationEmail) {
  if (!isCloudflareConfigured()) {
    throw new Error('Cloudflare is not configured in .env');
  }

  const cleanEmail = destinationEmail.trim().toLowerCase();
  const headers = getCloudflareHeaders();
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

  // Check if address already exists
  const info = await getEmailRoutingInfo();
  const existing = info.addresses?.find(a => a.email.toLowerCase() === cleanEmail);

  if (existing) {
    if (existing.verified) {
      return {
        alreadyExists: true,
        verified: true,
        message: `${cleanEmail} is already verified in Cloudflare! You can activate it directly.`,
        address: existing
      };
    } else {
      return {
        alreadyExists: true,
        verified: false,
        message: `${cleanEmail} was previously added but is pending verification. Please check your inbox for Cloudflare's verification email.`,
        address: existing
      };
    }
  }

  // Create destination address
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/email/routing/addresses`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email: cleanEmail })
  });

  const data = await res.json();
  if (!data.success) {
    const msg = data.errors?.[0]?.message || 'Failed to add destination address in Cloudflare';
    throw new Error(msg);
  }

  return {
    alreadyExists: false,
    verified: false,
    message: `Verification email sent by Cloudflare to ${cleanEmail}. Please click the link in that email to confirm.`,
    address: data.result
  };
}

/**
 * Update the routing rule for admin@icaregadget.store to forward to targetDestinationEmail
 */
export async function activateForwardingRule(targetDestinationEmail) {
  if (!isCloudflareConfigured()) {
    throw new Error('Cloudflare is not configured in .env');
  }

  const cleanEmail = targetDestinationEmail.trim().toLowerCase();
  const headers = getCloudflareHeaders();
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@icaregadget.store';

  const info = await getEmailRoutingInfo();
  const targetAddr = info.addresses?.find(a => a.email.toLowerCase() === cleanEmail);

  if (!targetAddr) {
    throw new Error(`Email ${cleanEmail} is not registered as a destination in Cloudflare. Please request verification first.`);
  }

  if (!targetAddr.verified) {
    throw new Error(`Email ${cleanEmail} is not yet verified. Please open the email from Cloudflare and click the verification link before activating.`);
  }

  if (info.ruleId) {
    // Update existing rule
    const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/email/routing/rules/${info.ruleId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        name: 'Admin Forwarding Rule',
        enabled: true,
        matchers: [
          {
            type: 'literal',
            field: 'to',
            value: adminEmail
          }
        ],
        actions: [
          {
            type: 'forward',
            value: [cleanEmail]
          }
        ]
      })
    });

    const data = await res.json();
    if (!data.success) {
      const msg = data.errors?.[0]?.message || 'Failed to update Cloudflare routing rule';
      throw new Error(msg);
    }
  } else {
    // Create new rule
    const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/email/routing/rules`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Admin Forwarding Rule',
        enabled: true,
        priority: 0,
        matchers: [
          {
            type: 'literal',
            field: 'to',
            value: adminEmail
          }
        ],
        actions: [
          {
            type: 'forward',
            value: [cleanEmail]
          }
        ]
      })
    });

    const data = await res.json();
    if (!data.success) {
      const msg = data.errors?.[0]?.message || 'Failed to create Cloudflare routing rule';
      throw new Error(msg);
    }
  }

  return {
    success: true,
    message: `Forwarding rule successfully updated! All emails sent to ${adminEmail} will now forward to ${cleanEmail}.`,
    currentForwardTo: cleanEmail
  };
}

/**
 * Delete a destination email address from Cloudflare
 */
export async function deleteDestinationAddress(addressTag) {
  if (!isCloudflareConfigured()) {
    throw new Error('Cloudflare is not configured in .env');
  }

  const headers = getCloudflareHeaders();
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/email/routing/addresses/${addressTag}`, {
    method: 'DELETE',
    headers
  });

  const data = await res.json();
  if (!data.success) {
    const msg = data.errors?.[0]?.message || 'Failed to delete destination address from Cloudflare';
    throw new Error(msg);
  }

  return {
    success: true,
    message: 'Destination address deleted from Cloudflare successfully.'
  };
}
