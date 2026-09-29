import os
import urllib.request
import sqlite3

TARGET_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../frontend/public/images/dishes'))
os.makedirs(TARGET_DIR, exist_ok=True)

# Curated high quality food photography from Unsplash
IMAGE_URLS = {
    'passion_fruit_mojito.jpg': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80', # passion fruit cocktail
    'lemon_juice.jpg': 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=800&auto=format&fit=crop&q=80', # iced lemonade
    'pineapple_juice.jpg': 'https://images.unsplash.com/photo-1546173159-315724a31696?w=800&auto=format&fit=crop&q=80', # pineapple juice
    'grape_crush.jpg': 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=800&auto=format&fit=crop&q=80', # berry grape drink
    'watermelon_juice.jpg': 'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=800&auto=format&fit=crop&q=80', # watermelon juice
    'chicken_momos.jpg': 'https://images.unsplash.com/photo-1625398407797-0097782cc687?w=800&auto=format&fit=crop&q=80', # dim sum momos
    'chicken_nuggets.jpg': 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&auto=format&fit=crop&q=80', # crispy chicken nuggets
    'samosa.jpg': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80', # samosa
    'mutton_soup.jpg': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&auto=format&fit=crop&q=80', # spiced meat soup
    'cream_of_mushroom.jpg': 'https://images.unsplash.com/photo-1607528971899-2e89e6c0ec69?w=800&auto=format&fit=crop&q=80', # mushroom soup
    'croissant_breads.jpg': 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&auto=format&fit=crop&q=80', # croissants
    'rumali_roti.jpg': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=80', # Indian flatbread
    'raw_mango_salad.jpg': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80', # green salad
    'irani_salad.jpg': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80', # fresh cucumber salad
    'veg_fruit_salad.jpg': 'https://images.unsplash.com/photo-1505253758473-96b3015f240a?w=800&auto=format&fit=crop&q=80', # fruit salad
    'italian_chopped_salad.jpg': 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800&auto=format&fit=crop&q=80', # chopped salad
    'smashed_chicken_salad.jpg': 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=800&auto=format&fit=crop&q=80', # chicken salad
    'egg_white_salad.jpg': 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&auto=format&fit=crop&q=80', # egg salad
    'mutton_biriyani.jpg': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80', # royal biryani
    'fish_tawa_fry.jpg': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&auto=format&fit=crop&q=80', # grilled fish
    'prawns_tawa_fry.jpg': 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&auto=format&fit=crop&q=80', # spicy prawns
    'squid_tawa.jpg': 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=80', # calamari
    'chicken_kebab.jpg': 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=80', # kebabs
    'chicken_curry_masala.jpg': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&auto=format&fit=crop&q=80', # chicken curry
    'veg_pulao_ghee_rice.jpg': 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&auto=format&fit=crop&q=80', # spiced rice pulao
    'paneer_butter_masala.jpg': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&auto=format&fit=crop&q=80', # paneer butter masala
    'cheese_cake.jpg': 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&auto=format&fit=crop&q=80', # cheesecake
    'carrot_halwa.jpg': 'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=800&auto=format&fit=crop&q=80', # carrot dessert
    'pudding.jpg': 'https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?w=800&auto=format&fit=crop&q=80', # caramel custard
    'brownies.jpg': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&auto=format&fit=crop&q=80', # chocolate brownie
    'ice_creams.jpg': 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=800&auto=format&fit=crop&q=80', # ice cream
    'kunaffa.jpg': 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=800&auto=format&fit=crop&q=80', # knafeh pastry
    'herbal_tea.jpg': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80', # herbal tea
    'tea_coffee.jpg': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80', # coffee/tea
    'beef_pepper_fry.jpg': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80', # roasted beef
    'chicken_65.jpg': 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&auto=format&fit=crop&q=80', # spicy fried chicken
    'varieties_of_salad.jpg': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80', # salad platter
}

def download_images():
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    for filename, url in IMAGE_URLS.items():
        filepath = os.path.join(TARGET_DIR, filename)
        if os.path.exists(filepath):
            print(f"Skipping already existing: {filename}")
            continue
        try:
            print(f"Downloading {filename}...")
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=15) as resp:
                with open(filepath, 'wb') as f:
                    f.write(resp.read())
            print(f"Saved {filename}")
        except Exception as e:
            print(f"Failed to download {filename}: {e}")

# Mapping menu items in DB to filenames
DB_MAPPING = {
    'Passion Fruit Mojito': '/images/dishes/passion_fruit_mojito.jpg',
    'Lemon Juice': '/images/dishes/lemon_juice.jpg',
    'Pineapple Juice': '/images/dishes/pineapple_juice.jpg',
    'Grape Crush': '/images/dishes/grape_crush.jpg',
    'Water Melon Juice': '/images/dishes/watermelon_juice.jpg',
    'Chicken Momos': '/images/dishes/chicken_momos.jpg',
    'Chicken Nuggets': '/images/dishes/chicken_nuggets.jpg',
    'Samosa': '/images/dishes/samosa.jpg',
    'Pazhampori': '/images/dishes/pazhampori.jpg',
    'Mutton Soup': '/images/dishes/mutton_soup.jpg',
    'Cream of Mushroom': '/images/dishes/cream_of_mushroom.jpg',
    'Croissant / Breads': '/images/dishes/croissant_breads.jpg',
    'Palappam': '/images/dishes/palappam.jpg',
    'Nool Porotta': '/images/dishes/nool_porotta.jpg',
    'Rumali Roti': '/images/dishes/rumali_roti.jpg',
    'Duck Mappas / Roast / Pepper / Kuttanadan': '/images/dishes/duck_mappas.jpg',
    'Raw Mango Salad': '/images/dishes/raw_mango_salad.jpg',
    'Irani Salad': '/images/dishes/irani_salad.jpg',
    'Veg & Fruit Mix Salad': '/images/dishes/veg_fruit_salad.jpg',
    'Italian Chopped Salad': '/images/dishes/italian_chopped_salad.jpg',
    'Smashed Chicken Salad': '/images/dishes/smashed_chicken_salad.jpg',
    'Egg White Green Salad': '/images/dishes/egg_white_salad.jpg',
    'Mutton Biriyani (with raita, pickle and pappad)': '/images/dishes/mutton_biriyani.jpg',
    'Fish Tawa Fry (King Fish)': '/images/dishes/fish_tawa_fry.jpg',
    'Prawns Tawa Fry': '/images/dishes/prawns_tawa_fry.jpg',
    'Squid Tawa (Roll)': '/images/dishes/squid_tawa.jpg',
    'Variety of Chicken Kebab (Tikka, Hariyali, Malai)': '/images/dishes/chicken_kebab.jpg',
    'Beef Tengakothu Ularthu': '/images/dishes/beef_thengakothu.jpg',
    'Chicken (Chilly / Hyderabadi / Masala)': '/images/dishes/chicken_curry_masala.jpg',
    'Veg Pulao / Ghee Rice': '/images/dishes/veg_pulao_ghee_rice.jpg',
    'Paneer Butter Masala': '/images/dishes/paneer_butter_masala.jpg',
    'Cheese Cake': '/images/dishes/cheese_cake.jpg',
    'Carrot Halwa': '/images/dishes/carrot_halwa.jpg',
    'Puddings': '/images/dishes/pudding.jpg',
    'Brownies': '/images/dishes/brownies.jpg',
    'Ice Creams': '/images/dishes/ice_creams.jpg',
    'Kunaffa': '/images/dishes/kunaffa.jpg',
    'Herbal Tea (Lemon / Mint / Ginger)': '/images/dishes/herbal_tea.jpg',
    'Tea, Coffee': '/images/dishes/tea_coffee.jpg',
    '15 kg Beef Pepper Fry': '/images/dishes/beef_pepper_fry.jpg',
    '10 kg Chicken 65': '/images/dishes/chicken_65.jpg',
    'Varieties of 2 Salad': '/images/dishes/varieties_of_salad.jpg',
}

def update_db():
    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../catering.db'))
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    # Remove any test item if exists
    c.execute("DELETE FROM menu_items WHERE name = 'test'")
    
    updated = 0
    for name, img in DB_MAPPING.items():
        c.execute("UPDATE menu_items SET image_url = ? WHERE name = ?", (img, name))
        if c.rowcount > 0:
            updated += 1
            
    conn.commit()
    conn.close()
    print(f"Updated {updated} menu items in database with image URLs.")

if __name__ == '__main__':
    download_images()
    update_db()
