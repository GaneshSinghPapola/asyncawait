﻿import references = require('references');
import Fiber = require('fibers');
export = fibersHotfix169;


//TODO: apply this by default? Check impact on benchmarks.


/**
 *  Automatically manages Fiber.poolSize to work around an issue with node-fibers.
 *  This mod is recommended when the peak number of concurrently executing fibers
 *  (there is one for each currently executing suspendable function) is likely to
 *  exceed 120. Memory leaks and slowdowns under heavy load are symptomatic of the
 *  issue fixed by this mod. See https://github.com/laverdet/node-fibers/issues/169.
 */
function fibersHotfix169(base, options) {

    // TODO: Set defaults
    //defaults: {
    //    fibersHotfix169: false
    //}


    // Return setup protocol overrides only if the 'fibersHotfix169' option is set.
    return (!options.fibersHotfix169) ? {} : {

        acquire: (asyncProtocol) => {
            inc();
            return base.acquire(asyncProtocol);
        },

        release: (asyncProtocol, fi) => {
            dec();
            return base.release(asyncProtocol, fi);
        },

        cleanup: () => {
            _fiberPoolSize = Fiber.poolSize;
            _activeFiberCount = 0;
            base.cleanup();
        }
    };
}


/** Increment the number of active fibers. */
function inc() {
    ++_activeFiberCount;
    if (_activeFiberCount >= _fiberPoolSize) {
        _fiberPoolSize += 100;
        Fiber.poolSize = _fiberPoolSize;
    }
}


/** Decrement the number of active fibers. */
function dec() {
    --_activeFiberCount;
}


// Private state.
//TODO: should this be global, in case multiple asyncawait instances are loaded in the process?
var _fiberPoolSize = Fiber.poolSize;
var _activeFiberCount = 0;