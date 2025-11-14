
// ============================================================================
// FILE: src/validators/rental.js
// Rental application specific validators.
// ============================================================================

export function registerRentalValidators(engine)
{
    // Always-run scrub / normalize
    engine.registerValidator(
        'rental:always:scrub',
        async ({ engine: eng }) =>
        {
            const pathsToTrim = [
                'applicant.first',
                'applicant.last',
                'contact.email',
                'contact.phone',
                'employment.employer',
                'notes'
            ];

            pathsToTrim.forEach((path) =>
            {
                const val = eng.getState(path);

                if (typeof val === 'string')
                {
                    eng.setState(
                        path,
                        val.trim(),
                        {
                            reason: 'scrub',
                            silent: true
                        }
                    );
                }
            });

            const hhSizeRaw = eng.getState('household.size');
            let hhSize = Number(hhSizeRaw || 1);

            if (!Number.isFinite(hhSize) || hhSize < 1)
            {
                hhSize = 1;
            }

            if (hhSize > 10)
            {
                hhSize = 10;
            }

            if (hhSize !== hhSizeRaw)
            {
                eng.setState(
                    'household.size',
                    hhSize,
                    {
                        reason: 'clamp:household',
                        silent: true
                    }
                );
            }

            return {
                ok: true
            };
        },
        {
            always: true
        }
    );

    // Exit Step 1: require basic applicant + contact
    engine.registerValidator(
        'rental:exit:step1-basics',
        async ({ engine: eng }) =>
        {
            const errors = [];

            if (!eng.getState('applicant.first'))
            {
                errors.push('First name is required.');
            }

            if (!eng.getState('applicant.last'))
            {
                errors.push('Last name is required.');
            }

            const email = (eng.getState('contact.email') || '').trim();

            if (!email)
            {
                errors.push('Email is required.');
            }
            else
            {
                // external library hook (placeholder)
                // Replace this with your real lib, e.g. ExternalValidator.isEmailValid(email)
                const fromExternal = window.ExternalValidator?.isEmailValid
                    ? !!window.ExternalValidator.isEmailValid(email)
                    : (email.includes('@') && email.includes('.'));

                if (!fromExternal)
                {
                    errors.push('Email format is invalid.');
                }
            }

            if (errors.length)
            {
                return {
                    ok: false,
                    errors
                };
            }

            return {
                ok: true
            };
        },
        {
            onExit: true
        },
        [
            ['onExitStep', 1]
        ]
    );

    // Entry Step 3: require current address basics
    engine.registerValidator(
        'rental:entry:step3-address',
        async ({ engine: eng }) =>
        {
            const addr = eng.getState('currentAddress') || {};
            const errors = [];

            if (!addr.line1?.trim())
            {
                errors.push('Current address line 1 is required.');
            }

            if (!addr.city?.trim())
            {
                errors.push('Current address city is required.');
            }

            if (!addr.country?.trim())
            {
                errors.push('Current address country is required.');
            }

            if (errors.length)
            {
                return {
                    ok: false,
                    errors
                };
            }

            return {
                ok: true
            };
        },
        {
            onEntry: true
        },
        [
            ['onEnterStep', 3]
        ]
    );

    // Entry Step 5: references + declaration + async email check
    engine.registerValidator(
        'rental:entry:step5-final',
        async ({ engine: eng }) =>
        {
            const errors = [];
            const refs = eng.getState('references') || [];

            if (!eng.getState('declarations.agree'))
            {
                errors.push('You must agree to the declaration.');
            }

            if (!refs.length)
            {
                errors.push('At least one reference is required.');
            }

            const email = (eng.getState('contact.email') || '').trim();

            eng.flags.isValidating = true;
            eng.emit(
                'validation:start',
                {
                    key: 'rental:entry:step5-final',
                    email
                }
            );

            // simulate async external API call
            await new Promise((resolve) => setTimeout(resolve, 300));

            // pretend external uniqueness check: emails ending in "@duplicate.com" are rejected
            if (email.endsWith('@duplicate.com'))
            {
                errors.push('Email is already in use. Choose another email address.');
            }

            eng.flags.isValidating = false;

            if (errors.length)
            {
                return {
                    ok: false,
                    errors
                };
            }

            return {
                ok: true
            };
        },
        {
            onEntry: true
        },
        [
            ['onEnterStep', 5]
        ]
    );
}