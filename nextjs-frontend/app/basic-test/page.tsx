export default function BasicTestPage() {
    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#f3f4f6',
            padding: '2rem',
            fontFamily: 'system-ui, sans-serif'
        }}>
            <div style={{
                maxWidth: '800px',
                margin: '0 auto',
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
                <h1 style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    marginBottom: '1rem',
                    color: '#111827'
                }}>
                    Basic HTML Test Page
                </h1>

                <p style={{
                    marginBottom: '2rem',
                    color: '#6b7280'
                }}>
                    This page uses inline styles to test if the basic HTML is working.
                </p>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginBottom: '2rem'
                }}>
                    <div style={{
                        backgroundColor: '#dbeafe',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid #93c5fd'
                    }}>
                        <h3 style={{ fontWeight: '600', color: '#1e40af' }}>Blue Card</h3>
                        <p style={{ color: '#3730a3', fontSize: '0.875rem' }}>This should be blue</p>
                    </div>

                    <div style={{
                        backgroundColor: '#dcfce7',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid #86efac'
                    }}>
                        <h3 style={{ fontWeight: '600', color: '#166534' }}>Green Card</h3>
                        <p style={{ color: '#15803d', fontSize: '0.875rem' }}>This should be green</p>
                    </div>

                    <div style={{
                        backgroundColor: '#fce7f3',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid #f9a8d4'
                    }}>
                        <h3 style={{ fontWeight: '600', color: '#be185d' }}>Pink Card</h3>
                        <p style={{ color: '#c2185b', fontSize: '0.875rem' }}>This should be pink</p>
                    </div>
                </div>

                <button style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: '500',
                    cursor: 'pointer',
                    marginRight: '1rem'
                }}>
                    Blue Button
                </button>

                <button style={{
                    backgroundColor: '#10b981',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: '500',
                    cursor: 'pointer'
                }}>
                    Green Button
                </button>

                <div style={{ marginTop: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
                        Status Check
                    </h2>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        <li style={{
                            padding: '0.5rem',
                            backgroundColor: '#f0fdf4',
                            marginBottom: '0.5rem',
                            borderRadius: '4px',
                            border: '1px solid #bbf7d0'
                        }}>
                            ✅ HTML is working
                        </li>
                        <li style={{
                            padding: '0.5rem',
                            backgroundColor: '#f0fdf4',
                            marginBottom: '0.5rem',
                            borderRadius: '4px',
                            border: '1px solid #bbf7d0'
                        }}>
                            ✅ Inline styles are working
                        </li>
                        <li style={{
                            padding: '0.5rem',
                            backgroundColor: '#fef3c7',
                            marginBottom: '0.5rem',
                            borderRadius: '4px',
                            border: '1px solid #fcd34d'
                        }}>
                            ⚠️ Need to test Tailwind CSS
                        </li>
                    </ul>
                </div>

                <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                    <h3 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Next Steps:</h3>
                    <ol style={{ paddingLeft: '1.5rem', color: '#6b7280' }}>
                        <li>If you can see this page with proper styling, HTML/CSS is working</li>
                        <li>Go to <code>/test-styling</code> to test Tailwind CSS</li>
                        <li>Go to <code>/login</code> to test the main app</li>
                    </ol>
                </div>
            </div>
        </div>
    )
}