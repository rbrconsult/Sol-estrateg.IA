/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme seu email — SOL estrateg.IA</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Text style={logo}>☀🤖 <span style={logoText}>SOL estrateg.IA</span></Text>
        </Section>
        <Heading style={h1}>Confirme seu email</Heading>
        <Text style={text}>
          Obrigado por se cadastrar na{' '}
          <Link href={siteUrl} style={link}>
            <strong>SOL estrateg.IA</strong>
          </Link>
          !
        </Text>
        <Text style={text}>
          Confirme seu endereço de email (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) clicando no botão abaixo:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Verificar Email
        </Button>
        <Text style={footer}>
          Se você não criou uma conta, pode ignorar este email com segurança.
        </Text>
        <Text style={footerBrand}>© SOL estrateg.IA — Energia inteligente para seu negócio.</Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '480px', margin: '0 auto' }
const logoSection = { textAlign: 'center' as const, marginBottom: '24px' }
const logo = { fontSize: '28px', margin: '0' }
const logoText = { color: '#1a2332', fontWeight: 'bold' as const }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#1a2332',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: '#6b7280',
  lineHeight: '1.5',
  margin: '0 0 25px',
}
const link = { color: '#22994d', textDecoration: 'underline' }
const button = {
  backgroundColor: '#22994d',
  color: '#ffffff',
  fontSize: '14px',
  borderRadius: '12px',
  padding: '12px 24px',
  textDecoration: 'none',
  fontWeight: 'bold' as const,
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
const footerBrand = { fontSize: '11px', color: '#bbbbbb', margin: '8px 0 0', textAlign: 'center' as const }
