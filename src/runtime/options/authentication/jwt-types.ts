// types grabbed from jsonwebtoken 9.0.7

// https://github.com/auth0/node-jsonwebtoken#algorithms-supported
export type Algorithm
  = | 'HS256'
    | 'HS384'
    | 'HS512'
    | 'RS256'
    | 'RS384'
    | 'RS512'
    | 'ES256'
    | 'ES384'
    | 'ES512'
    | 'PS256'
    | 'PS384'
    | 'PS512'
    | 'none'

// standard names https://www.rfc-editor.org/rfc/rfc7515.html#section-4.1
export interface JwtHeader {
  'alg': string | Algorithm
  'typ'?: string | undefined
  'cty'?: string | undefined
  'crit'?: Array<string | Exclude<keyof JwtHeader, 'crit'>> | undefined
  'kid'?: string | undefined
  'jku'?: string | undefined
  'x5u'?: string | string[] | undefined
  'x5t#S256'?: string | undefined
  'x5t'?: string | undefined
  'x5c'?: string | string[] | undefined
}

export interface SignOptions {
  algorithm?: Algorithm | undefined
  keyid?: string | undefined
  expiresIn?: string | number
  notBefore?: string | number | undefined
  audience?: string | string[] | undefined
  subject?: string | undefined
  issuer?: string | undefined
  jwtid?: string | undefined
  mutatePayload?: boolean | undefined
  noTimestamp?: boolean | undefined
  header?: JwtHeader | undefined
  encoding?: string | undefined
  allowInsecureKeySizes?: boolean | undefined
  allowInvalidAsymmetricKeyTypes?: boolean | undefined
}
