-- rateLimiter.lua
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local max_requests = tonumber(ARGV[3])
local unique_id = ARGV[4]

-- 1. Window ke bahar wale purane requests delete karo
local clear_before = now - window
redis.call('ZREMRANGEBYSCORE', key, 0, clear_before)

-- 2. Current window me kitne requests hain count karo
local current_requests = redis.call('ZCARD', key)

-- 3. Agar limit cross ho gayi toh block karo (0 return karo)
if current_requests >= max_requests then
    return 0
end

-- 4. Naya request add karo aur expiry set karo
redis.call('ZADD', key, now, unique_id)
redis.call('EXPIRE', key, window)

-- Allowed (1 return karo)
return 1