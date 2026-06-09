// VNet + NSG for the IDE backend. The session pool is injected into the
// `sessions` subnet; the NSG locks egress so untrusted sandboxes can only
// reach the internal LLM gateway and the package mirror — nothing else,
// including the cloud metadata endpoint.

@description('Location for all resources.')
param location string

@description('Prefix for resource names.')
param namePrefix string

@description('CIDR for the VNet.')
param vnetCidr string = '10.40.0.0/16'

@description('CIDR for the session-pool subnet (needs /23 or larger for ACA).')
param sessionsSubnetCidr string = '10.40.0.0/23'

@description('Egress allowlist: IP/CIDR of the internal LLM gateway.')
param llmGatewayCidr string

@description('Egress allowlist: IP/CIDR of the package mirror (PyPI proxy).')
param packageMirrorCidr string

resource nsg 'Microsoft.Network/networkSecurityGroups@2024-05-01' = {
  name: '${namePrefix}-sessions-nsg'
  location: location
  properties: {
    securityRules: [
      // Allow egress only to the internal LLM gateway.
      {
        name: 'allow-llm-gateway'
        properties: {
          priority: 100
          direction: 'Outbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: llmGatewayCidr
          destinationPortRange: '443'
        }
      }
      // Allow egress only to the package mirror.
      {
        name: 'allow-package-mirror'
        properties: {
          priority: 110
          direction: 'Outbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: packageMirrorCidr
          destinationPortRange: '443'
        }
      }
      // Explicitly block the cloud metadata endpoint (IMDS).
      {
        name: 'deny-imds'
        properties: {
          priority: 200
          direction: 'Outbound'
          access: 'Deny'
          protocol: '*'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: '169.254.169.254/32'
          destinationPortRange: '*'
        }
      }
      // Deny everything else outbound (default-deny).
      {
        name: 'deny-all-egress'
        properties: {
          priority: 4096
          direction: 'Outbound'
          access: 'Deny'
          protocol: '*'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: 'Internet'
          destinationPortRange: '*'
        }
      }
    ]
  }
}

resource vnet 'Microsoft.Network/virtualNetworks@2024-05-01' = {
  name: '${namePrefix}-vnet'
  location: location
  properties: {
    addressSpace: { addressPrefixes: [vnetCidr] }
    subnets: [
      {
        name: 'sessions'
        properties: {
          addressPrefix: sessionsSubnetCidr
          networkSecurityGroup: { id: nsg.id }
          // ACA / session pools require delegation to the managed environment.
          delegations: [
            {
              name: 'aca-delegation'
              properties: { serviceName: 'Microsoft.App/environments' }
            }
          ]
        }
      }
    ]
  }
}

output vnetId string = vnet.id
output sessionsSubnetId string = vnet.properties.subnets[0].id
